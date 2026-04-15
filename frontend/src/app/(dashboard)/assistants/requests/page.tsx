'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { assistants as assistantsApi } from '@/lib/api';
import { Assistant, AffiliationStatus } from '@/types';
import { Check, X, UserCheck, Clock } from 'lucide-react';

export default function AssistantRequestsPage() {
  const { t } = useLanguage();
  const [list, setList] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await assistantsApi.getPendingRequests();
      setList(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionId(id);
    try {
      await assistantsApi.approveAffiliation(id);
      load();
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionId(id);
    try {
      await assistantsApi.rejectAffiliation(id);
      load();
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-midnight-900">{t('assistantRequests.title')}</h1>
        <p className="text-midnight-600">{t('assistantRequests.subtitle')}</p>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">{t('assistantRequests.noPending')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100">
          {list.map((asst) => (
            <div key={asst.id} className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {asst.user?.firstName} {asst.user?.lastName}
                  </p>
                  <p className="text-sm text-slate-500">{asst.user?.email}</p>
                  {asst.title && <p className="text-xs text-slate-400">{asst.title}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleApprove(asst.id)}
                  disabled={actionId === asst.id}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                >
                  <Check size={15} />
                  {t('common.approve')}
                </button>
                <button
                  onClick={() => handleReject(asst.id)}
                  disabled={actionId === asst.id}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 disabled:opacity-60 transition-colors"
                >
                  <X size={15} />
                  {t('common.reject')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
