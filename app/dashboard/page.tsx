'use client';

import { useState } from 'react';

import DashboardLayout from '../../components/layouts/DashboardLayout';
import { DailyOperationsSummary, OperationsTimeline, EmergencyLog, BulletinBoard, BulletinItem } from '../../components/dashboard';
import '../../styles/dashboard.css';

// --- Page Component ---

export default function DashboardPage() {
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [bulletinItems, setBulletinItems] = useState<BulletinItem[]>([
    { id: '1', date: '01/11', title: '시스템 점검 안내', content: '01/15 02:00-04:00 시스템 점검이 예정되어 있습니다.', author: '관리자' },
    { id: '2', date: '01/10', title: '신규 직원 교육', content: '신규 직원 교육 일정을 확인해주세요.', author: '김팀장' },
    { id: '3', date: '01/08', title: '알고리즘 업데이트', content: '위급 감지 알고리즘이 업데이트 되었습니다.', author: '시스템' },
  ]);

  const handleAddBulletin = (item: Omit<BulletinItem, 'id'>) => {
    const newItem: BulletinItem = {
      ...item,
      id: String(Date.now()),
    };
    setBulletinItems((prev) => [newItem, ...prev]);
  };

  const handleEditBulletin = (id: string, item: Omit<BulletinItem, 'id'>) => {
    setBulletinItems((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...item } : b))
    );
  };

  const handleDeleteBulletin = (id: string) => {
    setBulletinItems((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <DashboardLayout
      csvModalOpen={csvModalOpen}
      onCsvModalOpenChange={setCsvModalOpen}
    >
      <div className="dashboard-container">
        {/* Hero Section: Daily Operations Summary */}
        <DailyOperationsSummary />

        {/* Middle Row: Bulletin Board + Timeline Chart */}
        <section className="dashboard-middle-row">
          {/* Left: Bulletin Board */}
          <BulletinBoard
            items={bulletinItems}
            onAdd={handleAddBulletin}
            onEdit={handleEditBulletin}
            onDelete={handleDeleteBulletin}
          />

          {/* Right: Timeline Chart */}
          <OperationsTimeline />
        </section>

        {/* Emergency Log */}
        <EmergencyLog />
      </div>
    </DashboardLayout>
  );
}

