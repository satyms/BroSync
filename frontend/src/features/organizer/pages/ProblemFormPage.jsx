import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '@api/axiosInstance';
import { API_ROUTES } from '@shared/utils/constants';
import { ArrowLeft, Save, Plus, Trash2, Eye, EyeOff, AlertCircle } from 'lucide-react';

const inputCls =
  'w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] ' +
  'rounded-xl px-4 py-3 text-[#0F172A] dark:text-[#E2E8F0] text-sm placeholder-[#94A3B8] ' +
  'focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200';

const monoCls =
  'w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] ' +
  'rounded-xl px-4 py-3 text-[#0F172A] dark:text-[#E2E8F0] text-xs font-mono placeholder-[#94A3B8] ' +
  'focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 resize-none';

const emptyTestCase = () => ({
  _key: Date.now() + Math.random(),
  input_data: '',
  expected_output: '',
  is_sample: false,
  order: 0,
});

export default function ProblemFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: '',
    description: '',
    input_format: '',
    output_format: '',
    constraints: '',
    difficulty: 'easy',
    time_limit_ms: 2000,
    memory_limit_mb: 256,
    is_published: false,
    category_id: '',
  });
  const [testCases, setTestCases] = useState([emptyTestCase()]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingInit, setLoadingInit] = useState(isEdit);
  const [activeTab, setActiveTab] = useState('details'); // details | testcases

  useEffect(() => {
    // Load categories
    axiosInstance.get(API_ROUTES.ORG_CATEGORIES)
      .then((r) => setCategories(r.data?.data || []))
      .catch(() => {});

    if (!isEdit) return;
    axiosInstance.get(API_ROUTES.ORG_PROBLEM_DETAIL(id))
      .then((r) => {
        const p = r.data?.data || r.data;
        setForm({
          title: p.title || '',
          description: p.description || '',
          input_format: p.input_format || '',
          output_format: p.output_format || '',
          constraints: p.constraints || '',
          difficulty: p.difficulty || 'easy',
          time_limit_ms: p.time_limit_ms || 2000,
          memory_limit_mb: p.memory_limit_mb || 256,
          is_published: p.is_published || false,
          category_id: p.category_id || '',
        });
        if (p.test_cases?.length > 0) {
          setTestCases(p.test_cases.map((tc) => ({ ...tc, _key: tc.id })));
        }
      })
      .catch(() => toast.error('Failed to load problem.'))
      .finally(() => setLoadingInit(false));
  }, [id, isEdit]);

  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [k]: val }));
  };

  const addTestCase = () =>
    setTestCases((prev) => [
      ...prev,
      { ...emptyTestCase(), order: prev.length },
    ]);

  const removeTestCase = (idx) =>
    setTestCases((prev) => prev.filter((_, i) => i !== idx));

  const setTC = (idx, field, val) =>
    setTestCases((prev) =>
      prev.map((tc, i) => (i === idx ? { ...tc, [field]: val } : tc))
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required.');
    if (!form.description.trim()) return toast.error('Description is required.');

    setLoading(true);
    try {
      const payload = {
        ...form,
        category_id: form.category_id || null,
        test_cases: testCases
          .filter((tc) => tc.input_data.trim() && tc.expected_output.trim())
          .map((tc, i) => ({
            input_data: tc.input_data,
            expected_output: tc.expected_output,
            is_sample: tc.is_sample,
            order: i,
          })),
      };

      if (isEdit) {
        await axiosInstance.put(API_ROUTES.ORG_PROBLEM_DETAIL(id), payload);
        toast.success('Problem updated!');
      } else {
        await axiosInstance.post(API_ROUTES.ORG_PROBLEMS, payload);
        toast.success('Problem created!');
      }
      navigate('/organizer/problems');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to save problem.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loadingInit) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const DIFF_OPTIONS = [
    { value: 'easy',   label: 'Easy',   color: 'text-green-500 bg-green-500/10 border-green-500/40' },
    { value: 'medium', label: 'Medium', color: 'text-amber-500 bg-amber-500/10 border-amber-500/40' },
    { value: 'hard',   label: 'Hard',   color: 'text-red-500   bg-red-500/10   border-red-500/40'   },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Link
          to="/organizer/problems"
          className="w-9 h-9 flex items-center justify-center border border-[#CBD5E1] dark:border-[#334155] rounded-xl text-[#64748B] hover:text-blue-500 hover:border-blue-500 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-[#E2E8F0]">
            {isEdit ? 'Edit Problem' : 'Create Problem'}
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            {isEdit ? 'Update problem details and test cases.' : 'Add a problem to your problem bank.'}
          </p>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-[#F1F5F9] dark:bg-[#0F172A] p-1 rounded-xl w-fit">
        {[
          { key: 'details', label: 'Problem Details' },
          { key: 'testcases', label: `Test Cases (${testCases.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#E2E8F0] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#E2E8F0]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* ── DETAILS TAB ───────────────────────────────────────────── */}
        {activeTab === 'details' && (
          <div className="space-y-5">
            {/* Core Info */}
            <div className="bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-semibold text-[#0F172A] dark:text-[#E2E8F0]">Problem Info</h2>

              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={set('title')}
                  placeholder="e.g. Two Sum"
                  className={inputCls}
                />
              </div>

              {/* Difficulty + Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1.5">Difficulty</label>
                  <div className="flex gap-2">
                    {DIFF_OPTIONS.map(({ value, label, color }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, difficulty: value }))}
                        className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                          form.difficulty === value
                            ? color
                            : 'border-[#CBD5E1] dark:border-[#334155] text-[#94A3B8]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1.5">Category</label>
                  <select value={form.category_id} onChange={set('category_id')} className={inputCls}>
                    <option value="">No Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Time + Memory limit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                    Time Limit (ms)
                  </label>
                  <input type="number" value={form.time_limit_ms} onChange={set('time_limit_ms')} min={100} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                    Memory Limit (MB)
                  </label>
                  <input type="number" value={form.memory_limit_mb} onChange={set('memory_limit_mb')} min={16} className={inputCls} />
                </div>
              </div>

              {/* Published toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm((p) => ({ ...p, is_published: !p.is_published }))}
                  className={`relative w-10 h-5 rounded-full transition-all duration-300 ${
                    form.is_published ? 'bg-blue-600' : 'bg-[#CBD5E1] dark:bg-[#334155]'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${
                      form.is_published ? 'left-5.5' : 'left-0.5'
                    }`}
                    style={{ left: form.is_published ? '22px' : '2px' }}
                  />
                </div>
                <span className="text-sm text-[#0F172A] dark:text-[#E2E8F0] font-medium">
                  {form.is_published ? 'Published' : 'Draft (not visible to users)'}
                </span>
              </label>
            </div>

            {/* Problem Statement */}
            <div className="bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-semibold text-[#0F172A] dark:text-[#E2E8F0]">Problem Statement</h2>

              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={set('description')}
                  placeholder="Full problem statement (HTML supported)..."
                  rows={8}
                  className={inputCls + ' resize-none'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1.5">Input Format</label>
                  <textarea
                    value={form.input_format}
                    onChange={set('input_format')}
                    placeholder="Describe input format..."
                    rows={4}
                    className={inputCls + ' resize-none'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1.5">Output Format</label>
                  <textarea
                    value={form.output_format}
                    onChange={set('output_format')}
                    placeholder="Describe output format..."
                    rows={4}
                    className={inputCls + ' resize-none'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">Constraints</label>
                <textarea
                  value={form.constraints}
                  onChange={set('constraints')}
                  placeholder="e.g. 1 ≤ n ≤ 10^5, 1 ≤ nums[i] ≤ 10^9"
                  rows={3}
                  className={inputCls + ' resize-none'}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── TEST CASES TAB ────────────────────────────────────────── */}
        {activeTab === 'testcases' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#64748B]">
                Sample test cases are shown to users in the problem statement.
                Hidden test cases are used for judging.
              </p>
              <button
                type="button"
                onClick={addTestCase}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Test Case
              </button>
            </div>

            {testCases.map((tc, i) => (
              <div
                key={tc._key || i}
                className="bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl p-5 shadow-sm space-y-4"
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-[#0F172A] dark:text-[#E2E8F0]">
                      Test Case #{i + 1}
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tc.is_sample}
                        onChange={(e) => setTC(i, 'is_sample', e.target.checked)}
                        className="w-3.5 h-3.5 accent-blue-600"
                      />
                      <span className="text-xs text-[#64748B]">Sample (visible)</span>
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTestCase(i)}
                    disabled={testCases.length === 1}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-red-500 hover:bg-red-500/10 disabled:opacity-30 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#64748B] mb-1.5">Input</label>
                    <textarea
                      value={tc.input_data}
                      onChange={(e) => setTC(i, 'input_data', e.target.value)}
                      placeholder="Test input..."
                      rows={4}
                      className={monoCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                      Expected Output
                    </label>
                    <textarea
                      value={tc.expected_output}
                      onChange={(e) => setTC(i, 'expected_output', e.target.value)}
                      placeholder="Expected output..."
                      rows={4}
                      className={monoCls}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Actions ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 justify-end pt-2">
          <Link
            to="/organizer/problems"
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
            {isEdit ? 'Save Changes' : 'Create Problem'}
          </button>
        </div>
      </form>
    </div>
  );
}
