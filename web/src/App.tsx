import { Route, Routes } from 'react-router-dom';
import styled from '@emotion/styled';
import { CheckCircle2 } from 'lucide-react';
import { usePlatform } from './api';
import { AboutPage, AuthPage, ChangePasswordPage, DirectoryPage, HomePage, InnovationDetailPage, StatisticsPage, SystemStatePage } from './pages/PublicPages';
import { WorkspacePage } from './pages/WorkspacePages';
import { ErrorScreen, LoadingScreen } from './ui';
import { palette } from './styles';

export function App() {
  const { loading, error, toast } = usePlatform();
  if (loading) return <LoadingScreen/>;
  if (error) return <ErrorScreen message={error}/>;
  return <>
    <Routes>
      <Route path="/" element={<HomePage/>}/>
      <Route path="/discover" element={<DirectoryPage/>}/>
      <Route path="/innovations/:slug" element={<InnovationDetailPage/>}/>
      <Route path="/statistics" element={<StatisticsPage/>}/>
      <Route path="/about" element={<AboutPage/>}/>
      <Route path="/login" element={<AuthPage mode="login"/>}/>
      <Route path="/register" element={<AuthPage mode="register"/>}/>
      <Route path="/forgot-password" element={<AuthPage mode="reset"/>}/>
      <Route path="/change-password" element={<ChangePasswordPage/>}/>
      <Route path="/forbidden" element={<SystemStatePage code="403" title="Access restricted" copy="Your current role, account state, or relationship does not permit access to this resource."/>}/>
      <Route path="/session-expired" element={<SystemStatePage code="419" title="Session expired" copy="Your secure session has ended. Sign in again to continue."/>}/>
      <Route path="/offline" element={<SystemStatePage code="OFFLINE" title="You are offline" copy="Reconnect to continue. Draft work will be retried when a connection is available."/>}/>
      <Route path="/maintenance" element={<SystemStatePage code="503" title="Planned maintenance" copy="LIDKEP is temporarily unavailable while essential maintenance is completed."/>}/>
      <Route path="/:workspace/:section" element={<WorkspacePage/>}/>
      <Route path="/:workspace/:section/:id" element={<WorkspacePage/>}/>
      <Route path="*" element={<SystemStatePage code="404" title="Page not found" copy="The page may have moved, been archived, or never existed."/>}/>
    </Routes>
    {toast&&<Toast role="status"><CheckCircle2 size={18}/>{toast}</Toast>}
  </>;
}

const Toast=styled.div`position:fixed;right:22px;bottom:22px;z-index:100;background:${palette.ink};color:white;padding:13px 16px;border-radius:10px;box-shadow:0 18px 40px #102a2733;display:flex;align-items:center;gap:9px;max-width:min(400px,calc(100vw - 32px));font-size:12px;font-weight:700;svg{color:${palette.lime}}`;
