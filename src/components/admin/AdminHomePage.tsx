import React, { useState } from 'react';
import { Member, OrganizationSettings, ActiveTab } from '../../types';
import { AdminHomeOverview } from './AdminHomeOverview';
import { AdminFridayNotificationPage } from './AdminFridayNotificationPage';

export interface AdminHomePageProps {
  adminMember?: Member;
  allMembers: Member[];
  settings: OrganizationSettings;
  onNavigateTab: (tab: ActiveTab) => void;
  onRecordDeposit: (memberId?: string, weekNumber?: number) => void;
  onEditMember?: (member: Member) => void;
  onUpdateMemberAvatar?: (memberId: string, photoUrl?: string) => void;
  onUpdateWeeklyDeposit?: (data: {
    memberId: string;
    weekNumber: number;
    amount: number;
    date?: string;
    status: 'paid' | 'due' | 'advance';
    method?: 'cash' | 'bkash' | 'nagad' | 'bank';
    notes?: string;
  }) => void;
}

/**
 * AdminHomePage
 * Dedicated Admin Home Screen.
 * Renders Administrative Overview, organization summary, quick actions,
 * and handles sub-navigation to Friday Notification page.
 */
export const AdminHomePage: React.FC<AdminHomePageProps> = ({
  adminMember,
  allMembers,
  settings,
  onNavigateTab,
  onRecordDeposit,
}) => {
  const [currentView, setCurrentView] = useState<'home' | 'friday-notification'>('home');

  if (currentView === 'friday-notification') {
    return (
      <AdminFridayNotificationPage
        onBack={() => setCurrentView('home')}
        members={allMembers}
        settings={settings}
      />
    );
  }

  return (
    <div id="admin-home-page" className="space-y-4 pb-20">
      {/* Administrative Overview & Quick Actions */}
      <AdminHomeOverview
        members={allMembers}
        settings={settings}
        onNavigateTab={onNavigateTab}
        onRecordDeposit={(mId, wNum) =>
          onRecordDeposit(mId || adminMember?.id, wNum || settings.currentWeek)
        }
        onNavigateFridayNotification={() => setCurrentView('friday-notification')}
      />
    </div>
  );
};

