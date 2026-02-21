import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '@api/axiosInstance';
import { API_ROUTES } from '@shared/utils/constants';
import { ArrowLeft, Save, Globe, Lock, Plus, Trash2, Code2, ChevronUp, ChevronDown } from 'lucide-react';

const inputCls =
  'w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] ' +
  'rounded-xl px-4 py-3 text-[#0F172A] dark:text-[#E2E8F0] text-sm placeholder-[#94A3B8] ' +
  'focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200';

const STATUSES = ['draft', 'upcoming', 'active', 'ended'];

function ProblemRow({ problem, order, points, onRemove, onPointsChange, onOrderChange, isFirst, isLast }) {
  return (
    <div className="flex items-center gap-3 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] rounded-xl px-4 py-3">
      <div className="flex flex-col gap-0.5">
        <button onClick={() => !isFirst && onOrderChange(-1)} disabled={isFirst}
          className="p-0.5 text-[#94A3B8] hover:text-blue-500 disabled:opacity-30 transition-colors">
          <ChevronUp className="w-3 h-3" />
        </button>
        <button onClick={() => !isLast && onOrderChange(1)} disabled={isLast}
          className="p-0.5 text-[#94A3B8] hover:text-blue-500 disabled:opacity-30 transition-colors">
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
      <span className="text-xs text-[#64748B] w-6 text-center font-mono">{order + 1}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-[#0F172A] dark:text-[#E2E8F0] truncate">{problem.title}</p>
        <p className="text-[10px] text-[#64748B] capitalize">{problem.difficulty}</p>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-[#64748B]">Pts:</label>
        <input
          type="number"
          value={points}
          onChange={(e) => onPointsChange(Number(e.target.value))}
          min={0}
          className="w-16 text-xs text-center bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-lg px-2 py-1 text-[#0F172A] dark:text-[#E2E8F0] focus:outline-none focus:border-blue-500"
        />
      </div>
      <button
        onClick={onRemove}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-red-500 hover:bg-red-500/10 transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function ContestFormPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // present when editing
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'draft',
    visibility: 'public',
    start_time: '',
    end_time: '',
    penalty_time_minutes: 20,
    max_participants: 0,
  });
  const [problems, setProblems] = useState([]); // { problem, order, points }
  const [allProblems, setAllProblems] = useState([]);
  const [searchQ, setSearchQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingInit, setLoadingInit] = useState(isEdit);
  const [showProblemPicker, setShowProblemPicker] = useState(false);

  // Load existing contest if editing
  useEffect(() => {
    if (!isEdit) return;
    axiosInstance.get(API_ROUTES.ORG_CONTEST_DETAIL(id))
      .then((r) => {
        const c = r.data?.data || r.data;
        const toLocal = (dt) => dt ? new Date(dt).toISOString().slice(0, 16) : '';
        setForm({
          title: c.title || '',
          description: c.description || '',
          status: c.status || 'draft',
          visibility: c.visibility || 'public',
          start_time: toLocal(c.start_time),
          end_time: toLocal(c.end_time),
          penalty_time_minutes: c.penalty_time_minutes || 20,
          max_participants: c.max_participants || 0,
        });
        const cps = c.contest_problems || [];
        setProblems(cps.map((cp) => ({
          id: cp.problem_id,
          title: cp.title,
          slug: cp.slug,
          difficulty: cp.difficulty,
          order: cp.order,
          points: cp.points,
        })));
      })
      .catch(() => toast.error('Failed to load contest.'))
      .finally(() => setLoadingInit(false));
  }, [id, isEdit]);

  // Load all available problems for picker
  useEffect(() => {
    axiosInstance.get(API_ROUTES.ORG_PROBLEMS)
      .then((r) => setAllProblems(r.data?.data?.results || []))
      .catch(() => {});
  }, []);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required.');
    if (!form.start_time || !form.end_time) return toast.error('Start and end time are required.');
    if (new Date(form.start_time) >= new Date(form.end_time))
      return toast.error('End time must be after start time.');

    setLoading(true);
    try {
      const payload = {
        ...form,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
      };
      let res;
      if (isEdit) {
        res = await axiosInstance.put(API_ROUTES.ORG_CONTEST_DETAIL(id), payload);
      } else {
        res = await axiosInstance.post(API_ROUTES.ORG_CONTESTS, payload);
      }
      const savedContest = res.data?.data || res.data;

      // Sync problems in the contest
      if (isEdit || problems.length > 0) {
        const cid = savedContest.id || id;
        for (const [i, p] of problems.entries()) {
          await axiosInstance.post(API_ROUTES.ORG_CONTEST_PROBLEMS(cid), {
            problem_id: p.id,
            order: i,
            points: p.points,
          }).catch(() => {});
        }
      }

      toast.success(isEdit ? 'Contest updated!' : 'Contest created!');
      navigate('/organizer/contests');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to save contest.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const addProblem = (p) => {
    if (problems.find((x) => x.id === p.id)) {
      toast.error('Already added.');
      return;
    }
    setProblems((prev) => [...prev, { ...p, order: prev.length, points: 100 }]);
    setShowProblemPicker(false);
  };

  const removeProblem = (idx) => {
    setProblems((prev) => prev.filter((_, i) => i !== idx).map((p, i) => ({ ...p, order: i })));
  };

  const updatePoints = (idx, pts) => {
    setProblems((prev) => prev.map((p, i) => (i === idx ? { ...p, points: pts } : p)));
  };

  const moveOrder = (idx, dir) => {
    setProblems((prev) => {
      const arr = [...prev];
      const swap = idx + dir;
      [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
      return arr.map((p, i) => ({ ...p, order: i }));
    });
  };

  const filteredProblems = allProblems.filter(
    (p) =>
      !problems.find((x) => x.id === p.id) &&
      p.title.toLowerCase().includes(searchQ.toLowerCase())
  );

  if (loadingInit) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Link
          to="/organizer/contests"
          className="w-9 h-9 flex items-center justify-center border border-[#CBD5E1] dark:border-[#334155] rounded-xl text-[#64748B] hover:text-blue-500 hover:border-blue-500 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-[#E2E8F0]">
            {isEdit ? 'Edit Contest' : 'Create Contest'}
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            {isEdit ? 'Update contest details.' : 'Configure and launch a new coding contest.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Basic Info ────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-semibold text-[#0F172A] dark:text-[#E2E8F0]">Basic Information</h2>

          <div>
            <label className="block text-xs font-medium text-[#64748B] mb-1.5">
              Contest Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={set('title')}
              placeholder="e.g. Weekly Round #48"
              className={inputCls}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#64748B] mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              placeholder="Contest description, rules, prizes..."
              rows={4}
              className={inputCls + ' resize-none'}
            />
          </div>

          {/* Status + Visibility */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1.5">Status</label>
              <select value={form.status} onChange={set('status')} className={inputCls}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1.5">Visibility</label>
              <div className="flex gap-2">
                {['public', 'private'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, visibility: v }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                      form.visibility === v
                        ? v === 'public'
                          ? 'bg-green-500/10 border-green-500/40 text-green-500'
                          : 'bg-amber-500/10 border-amber-500/40 text-amber-500'
                        : 'border-[#CBD5E1] dark:border-[#334155] text-[#94A3B8]'
                    }`}
                  >
                    {v === 'public' ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Schedule ──────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-semibold text-[#0F172A] dark:text-[#E2E8F0]">Schedule</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.start_time}
                onChange={set('start_time')}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.end_time}
                onChange={set('end_time')}
                className={inputCls}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                Penalty Time (minutes)
              </label>
              <input
                type="number"
                value={form.penalty_time_minutes}
                onChange={set('penalty_time_minutes')}
                min={0}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                Max Participants (0 = unlimited)
              </label>
              <input
                type="number"
                value={form.max_participants}
                onChange={set('max_participants')}
                min={0}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* ── Problems ──────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#0F172A] dark:text-[#E2E8F0]">
              Problems <span className="text-[#64748B] font-normal">({problems.length})</span>
            </h2>
            <button
              type="button"
              onClick={() => setShowProblemPicker((p) => !p)}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Problem
            </button>
          </div>

          {/* Problem Picker */}
          {showProblemPicker && (
            <div className="border border-[#CBD5E1] dark:border-[#334155] rounded-xl overflow-hidden">
              <div className="p-3 border-b border-[#CBD5E1] dark:border-[#334155]">
                <input
                  type="text"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search problems..."
                  className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] rounded-lg px-3 py-2 text-sm text-[#0F172A] dark:text-[#E2E8F0] placeholder-[#94A3B8] focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredProblems.length === 0 ? (
                  <p className="text-xs text-[#64748B] py-4 text-center">
                    {allProblems.length === 0
                      ? 'No problems in your bank yet.'
                      : 'All problems already added.'}
                  </p>
                ) : (
                  filteredProblems.map((p) => {
                    const diffColor = { easy: 'text-green-500', medium: 'text-amber-500', hard: 'text-red-500' }[p.difficulty] || 'text-[#64748B]';
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addProblem(p)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-blue-500/5 transition-colors text-left"
                      >
                        <span className="text-[#0F172A] dark:text-[#E2E8F0]">{p.title}</span>
                        <span className={`text-xs font-semibold capitalize ${diffColor}`}>{p.difficulty}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Added Problems */}
          {problems.length > 0 ? (
            <div className="space-y-2">
              {problems.map((p, i) => (
                <ProblemRow
                  key={p.id}
                  problem={p}
                  order={i}
                  points={p.points}
                  isFirst={i === 0}
                  isLast={i === problems.length - 1}
                  onRemove={() => removeProblem(i)}
                  onPointsChange={(pts) => updatePoints(i, pts)}
                  onOrderChange={(dir) => moveOrder(i, dir)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#64748B] text-center py-4">
              No problems added yet. Click "Add Problem" to start.
            </p>
          )}
        </div>

        {/* ── Actions ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 justify-end">
          <Link
            to="/organizer/contests"
            className="px-5 py-2.5 border border-[#CBD5E1] dark:border-[#334155] text-[#475569] dark:text-[#94A3B8] text-sm font-semibold rounded-xl hover:border-blue-400 transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEdit ? 'Save Changes' : 'Create Contest'}
          </button>
        </div>
      </form>
    </div>
  );
}
