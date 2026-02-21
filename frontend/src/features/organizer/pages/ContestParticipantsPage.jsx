import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '@api/axiosInstance';
import { API_ROUTES } from '@shared/utils/constants';
import { ArrowLeft, Download, UserX, Search, Medal } from 'lucide-react';

function exportCSV(participants, contestTitle) {
  const headers = ['Rank', 'Username', 'Email', 'Score', 'Penalty', 'Problems Solved', 'Joined At'];
  const rows = participants.map((p, i) => [
    i + 1,
    p.username,
    p.email,
    p.score,
    p.penalty,
    p.problems_solved,
    p.joined_at ? new Date(p.joined_at).toLocaleString() : '',
  ]);
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `participants-${(contestTitle || 'contest').replace(/\s+/g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ContestParticipantsPage() {
  const { contestId } = useParams();
  const [participants, setParticipants] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [contestTitle, setContestTitle] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [disqualifying, setDisqualifying] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          axiosInstance.get(API_ROUTES.ORG_PARTICIPANTS(contestId)),
          axiosInstance.get(API_ROUTES.ORG_CONTEST_DETAIL(contestId)),
        ]);
        const data = pRes.data?.data || pRes.data || [];
        setParticipants(data);
        setFiltered(data);
        setContestTitle(cRes.data?.data?.title || cRes.data?.title || '');
      } catch {
        toast.error('Failed to load participants.');
      } finally {
        setLoading(false);
      }
    })();
  }, [contestId]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(participants); return; }
    const q = search.toLowerCase();
    setFiltered(participants.filter((p) =>
      p.username?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)
    ));
  }, [search, participants]);

  const disqualify = async (pid) => {
    if (!window.confirm('Disqualify this participant? This action cannot be undone.')) return;
    setDisqualifying(pid);
    try {
      await axiosInstance.post(API_ROUTES.ORG_DISQUALIFY(contestId, pid));
      setParticipants((prev) => prev.map((p) => p.id === pid ? { ...p, is_disqualified: true } : p));
      toast.success('Participant disqualified.');
    } catch {
      toast.error('Failed to disqualify participant.');
    } finally {
      setDisqualifying(null);
    }
  };

  const rankBadge = (rank) => {
    if (rank === 1) return <span className="text-amber-400 font-bold">#1</span>;
    if (rank === 2) return <span className="text-slate-400 font-bold">#2</span>;
    if (rank === 3) return <span className="text-amber-600 font-bold">#3</span>;
    return <span className="text-[#64748B]">#{rank}</span>;
  };

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Link
          to="/organizer/contests"
          className="w-9 h-9 flex items-center justify-center border border-[#CBD5E1] dark:border-[#334155] rounded-xl text-[#64748B] hover:text-blue-500 hover:border-blue-500 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-[#E2E8F0] truncate">
            {contestTitle ? `${contestTitle} — Participants` : 'Participants'}
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">{participants.length} registered participants</p>
        </div>
        <button
          onClick={() => exportCSV(filtered, contestTitle)}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2 border border-[#CBD5E1] dark:border-[#334155] text-[#475569] dark:text-[#94A3B8] text-sm font-semibold rounded-xl hover:border-blue-400 hover:text-blue-500 disabled:opacity-40 transition-all"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Participants', value: participants.length },
          { label: 'Active',            value: participants.filter((p) => !p.is_disqualified).length },
          { label: 'Disqualified',      value: participants.filter((p) => p.is_disqualified).length },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl p-5 shadow-sm text-center"
          >
            <p className="text-2xl font-bold text-[#0F172A] dark:text-[#E2E8F0]">{value}</p>
            <p className="text-xs text-[#64748B] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Search ────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username or email..."
          className="w-full bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-xl pl-11 pr-4 py-3 text-sm text-[#0F172A] dark:text-[#E2E8F0] placeholder-[#94A3B8] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Medal className="w-10 h-10 text-[#94A3B8] mx-auto mb-3" />
            <p className="text-[#64748B] text-sm">No participants found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#F8FAFC] dark:bg-[#0F172A]">
              <tr>
                {['Rank', 'User', 'Score', 'Penalty', 'Solved', 'Joined', 'Status', 'Action'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] border-b border-[#CBD5E1] dark:border-[#334155] first:pl-6 last:pr-6"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr
                  key={p.id}
                  className={`border-b border-[#F1F5F9] dark:border-[#1E293B] hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A]/50 transition-colors ${
                    p.is_disqualified ? 'opacity-50' : ''
                  }`}
                >
                  <td className="pl-6 py-4 text-sm font-semibold">{rankBadge(i + 1)}</td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-[#E2E8F0]">{p.username}</p>
                    <p className="text-xs text-[#64748B]">{p.email}</p>
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-blue-600 dark:text-blue-400">{p.score}</td>
                  <td className="px-4 py-4 text-sm text-[#64748B]">{p.penalty}</td>
                  <td className="px-4 py-4 text-sm text-[#0F172A] dark:text-[#E2E8F0]">{p.problems_solved}</td>
                  <td className="px-4 py-4 text-xs text-[#64748B] whitespace-nowrap">
                    {p.joined_at ? new Date(p.joined_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-4">
                    {p.is_disqualified ? (
                      <span className="px-2.5 py-1 bg-red-500/10 text-red-500 text-xs font-semibold rounded-lg">
                        Disqualified
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-green-500/10 text-green-600 text-xs font-semibold rounded-lg">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="pr-6 py-4">
                    {!p.is_disqualified && (
                      <button
                        onClick={() => disqualify(p.id)}
                        disabled={disqualifying === p.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-500 border border-red-500/40 rounded-lg hover:bg-red-500/10 disabled:opacity-50 transition-all"
                      >
                        {disqualifying === p.id ? (
                          <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <UserX className="w-3 h-3" />
                        )}
                        Disqualify
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
