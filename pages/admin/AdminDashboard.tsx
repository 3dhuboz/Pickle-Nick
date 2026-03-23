import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardHome from './DashboardHome';
import Orders from './Orders';
import Inventory from './Inventory';
import SocialAIBridge from './SocialAIBridge';
import Settings from './Settings';
import Users from './Users';
import CMS from './CMS';
import Inbox from './Inbox';

const AdminDashboard = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<DashboardHome />} />
      <Route path="orders" element={<Orders />} />
      <Route path="inventory" element={<Inventory />} />
      <Route path="cms" element={<CMS />} />
      <Route path="inbox" element={<Inbox />} />
      <Route path="social" element={<SocialAIBridge />} />
      <Route path="users" element={<Users />} />
      <Route path="settings" element={<Settings />} />
      <Route path="*" element={<DashboardHome />} />
    </Routes>
  );
};

export default AdminDashboard;