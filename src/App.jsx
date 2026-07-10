import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/i18n';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import PortalLayout from '@/components/PortalLayout';
import Landing from '@/pages/Landing';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ETLPipeline from '@/pages/admin/ETLPipeline';
import ConnectorMonitor from '@/pages/admin/ConnectorMonitor';
import SuperAdminVault from '@/pages/admin/SuperAdminVault';
import AlphaEconomistCopilot from '@/pages/staff/AlphaEconomistCopilot';
import DigitalTwinSandbox from '@/pages/staff/DigitalTwinSandbox';
import ReportGenerator from '@/pages/staff/ReportGenerator';
import IEMH from '@/pages/staff/IEMH';
import SDGTracker from '@/pages/staff/SDGTracker';
import WardGISMap from '@/pages/public/WardGISMap';
import PolicyPlayground from '@/pages/public/PolicyPlayground';
import DataStorytelling from '@/pages/public/DataStorytelling';
import SDGVNRGenerator from '@/pages/public/SDGVNRGenerator';
import CitizenFeedback from '@/pages/public/CitizenFeedback';
import RegistryExplorer from '@/pages/admin/RegistryExplorer';
import ComplianceCenter from '@/pages/admin/ComplianceCenter';
import GovernanceCockpit from '@/pages/staff/GovernanceCockpit';
import CollaborationHub from '@/pages/staff/CollaborationHub';
import DepartmentalHandshake from '@/pages/staff/DepartmentalHandshake';
import WardObservatory from '@/pages/staff/WardObservatory';
import InfrastructureMapper from '@/pages/staff/InfrastructureMapper';
import TradeSandbox from '@/pages/staff/TradeSandbox';
import KnowledgeVault from '@/pages/staff/KnowledgeVault';
import DigitalAuditVault from '@/pages/staff/DigitalAuditVault';
import IntegrityWorkbench from '@/pages/staff/IntegrityWorkbench';
import FiscalOversight from '@/pages/staff/FiscalOversight';
import ResourceManager from '@/pages/staff/ResourceManager';
import ProcurementGateway from '@/pages/staff/ProcurementGateway';
import MediaRoom from '@/pages/public/MediaRoom';
import ResearchWorkspace from '@/pages/public/ResearchWorkspace';
import PersonaGateway from '@/pages/public/PersonaGateway';
import KenyaAtAGlance from '@/pages/public/KenyaAtAGlance';
import { LayoutDashboard, Database, Server, Shield, Brain, Sliders, FileText, Cpu, Target, Map, Sparkles, BookOpen, Globe2, MessageSquare, Table2, Lock, Award, Users, Newspaper, Code2, Scale, MapPin, Briefcase, BookOpenCheck, GitBranch, DollarSign, ShoppingCart, Handshake } from 'lucide-react';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Landing />} />


      {/* Authentication Gateway Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* <Route path="/forgot-password" element={<ForgotPassword />} /> */}


      {/* Portal A: Admin Control Center */}
      <Route path="/admin" element={
        <PortalLayout portalKey="Admin" accentColor="amber" navItems={[
          { label: 'Overview', items: [
            { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
          ]},
          { label: 'Data Factory', items: [
            { path: '/admin/etl', label: 'Connect to Data', icon: Database },
            { path: '/admin/connectors', label: 'Live Connectors', icon: Server },
          ]},
          { label: 'Governance', items: [
            { path: '/admin/registry', label: 'Registry Explorer', icon: Table2 },
            { path: '/admin/compliance', label: 'Compliance & Privacy', icon: Lock },
            { path: '/admin/vault', label: 'Super Admin Vault', icon: Shield },
          ]},
        ]} />
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="etl" element={<ETLPipeline />} />
        <Route path="connectors" element={<ConnectorMonitor />} />
        <Route path="registry" element={<RegistryExplorer />} />
        <Route path="compliance" element={<ComplianceCenter />} />
        <Route path="vault" element={<SuperAdminVault />} />
      </Route>

      {/* Portal B: KIPPRA Staff Intelligence Hub */}
      <Route path="/staff" element={
        <PortalLayout portalKey="Staff" accentColor="primary" navItems={[
          { label: 'Gateway', items: [
            { path: '/staff/handshake', label: 'Departmental Handshake', icon: Handshake },
          ]},
          { label: 'Shared Brain', items: [
            { path: '/staff', label: 'AlphaEconomist Copilot', icon: Brain },
            { path: '/staff/collab', label: 'Collaboration Hub', icon: Users },
          ]},
          { label: 'Governance Cockpit', items: [
            { path: '/staff/cockpit', label: 'National Pulse', icon: Award },
          ]},
          { label: 'Intelligence Factory', items: [
            { path: '/staff/digital-twin', label: 'Digital Twin Sandbox', icon: Sliders },
            { path: '/staff/iemh', label: 'Modelling Hub (IEMH)', icon: Cpu },
            { path: '/staff/ward-observatory', label: 'Ward SAE Observatory', icon: MapPin },
            { path: '/staff/integrity', label: 'Integrity Workbench', icon: Scale },
            { path: '/staff/sdg', label: 'SDG Tracker', icon: Target },
          ]},
          { label: 'Development & Strategy', items: [
            { path: '/staff/infrastructure', label: 'Infrastructure Mapper', icon: Map },
            { path: '/staff/trade', label: 'Trade Sandbox', icon: Briefcase },
            { path: '/staff/knowledge-vault', label: 'Knowledge Vault', icon: BookOpenCheck },
          ]},
          { label: 'Operational Bedrock', items: [
            { path: '/staff/audit-vault', label: 'Digital Audit Vault', icon: GitBranch },
            { path: '/staff/fiscal', label: 'Fiscal Oversight', icon: DollarSign },
            { path: '/staff/resources', label: 'Resource Manager', icon: Users },
            { path: '/staff/procurement', label: 'Procurement Gateway', icon: ShoppingCart },
          ]},
          { label: 'Dissemination', items: [
            { path: '/staff/reports', label: 'Report Generator', icon: FileText },
          ]},
        ]} />
      }>
        <Route index element={<AlphaEconomistCopilot />} />
        <Route path="handshake" element={<DepartmentalHandshake />} />
        <Route path="cockpit" element={<GovernanceCockpit />} />
        <Route path="digital-twin" element={<DigitalTwinSandbox />} />
        <Route path="reports" element={<ReportGenerator />} />
        <Route path="iemh" element={<IEMH />} />
        <Route path="ward-observatory" element={<WardObservatory />} />
        <Route path="integrity" element={<IntegrityWorkbench />} />
        <Route path="sdg" element={<SDGTracker />} />
        <Route path="infrastructure" element={<InfrastructureMapper />} />
        <Route path="trade" element={<TradeSandbox />} />
        <Route path="knowledge-vault" element={<KnowledgeVault />} />
        <Route path="audit-vault" element={<DigitalAuditVault />} />
        <Route path="fiscal" element={<FiscalOversight />} />
        <Route path="resources" element={<ResourceManager />} />
        <Route path="procurement" element={<ProcurementGateway />} />
        <Route path="collab" element={<CollaborationHub />} />
      </Route>

      {/* Portal C: Public Citizen Lab */}
      <Route path="/public" element={
        <PortalLayout portalKey="Public" accentColor="teal" navItems={[
          { label: 'Front Door', items: [
            { path: '/public/gateway', label: 'Persona Gateway', icon: Users },
            { path: '/public/glance', label: 'Kenya at a Glance', icon: Globe2 },
          ]},
          { label: 'Explore', items: [
            { path: '/public', label: 'Ward-Level GIS', icon: Map },
            { path: '/public/playground', label: 'Policy Playground', icon: Sparkles },
            { path: '/public/stories', label: 'Data Stories', icon: BookOpen },
          ]},
          { label: 'Workspaces', items: [
            { path: '/public/research', label: 'Research Workspace', icon: Code2 },
            { path: '/public/media', label: 'Media Room', icon: Newspaper },
          ]},
          { label: 'Engage', items: [
            { path: '/public/vnr', label: 'SDG VNR Generator', icon: Globe2 },
            { path: '/public/feedback', label: 'Ground-Truthing', icon: MessageSquare },
          ]},
        ]} />
      }>
        <Route index element={<WardGISMap />} />
        <Route path="gateway" element={<PersonaGateway />} />
        <Route path="glance" element={<KenyaAtAGlance />} />
        <Route path="playground" element={<PolicyPlayground />} />
        <Route path="stories" element={<DataStorytelling />} />
        <Route path="research" element={<ResearchWorkspace />} />
        <Route path="media" element={<MediaRoom />} />
        <Route path="vnr" element={<SDGVNRGenerator />} />
        <Route path="feedback" element={<CitizenFeedback />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </LanguageProvider>
    </AuthProvider>
  )
}

export default App