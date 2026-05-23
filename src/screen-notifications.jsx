/* global React, Icon, TopBar */

const NotificationsScreen = ({ onBack }) => {
  return (
    <div className="scroll">
      <TopBar title="התראות" onBack={onBack} />
      <div className="px-22">
        <div className="card dashed" style={{ padding: 40, textAlign: "center", background: "transparent" }}>
          <div className="small muted" style={{ marginBottom: 4 }}>אין התראות</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>תקבל כאן עדכונים על חשבונות בפיגור ופעילות בבית</div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { NotificationsScreen });
