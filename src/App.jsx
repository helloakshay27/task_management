import "./index.css";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import ProtectedRoute from "./pages/Login/ProtectedRoute.jsx";
import { useEffect, useState } from "react";
import Layout from "./Layout";
import Tasks from "./pages/Home/Tasks";
import TaskDetails from "./pages/Home/TaskDetails";
import Projects from "./pages/Home/Projects";
import ProjectDetails from "./pages/Home/ProjectDetails";
import Sprints from "./pages/Home/Sprints";
import MileStoneMain from "./Milestone/MileStoneMain";
import MinutesOfMeeting from "./pages/Home/MinutesOfMeeting";
import MoMAdd from "./pages/Home/MoMAdd";
import Channel from "./components/Home/Channel/Channel";
import Role from "./pages/Setup/Role";
import EscalationMatrix from "./pages/Setup/EscalationMatrix";
import ProjectTeams from "./pages/Setup/ProjectTeams";
import Details from "./components/Setup/Internal_Users/Details";
import ExternalUsers from "./pages/Setup/ExternalUsers";
import TeamDetails from "./components/Setup/ProjectTeams/Details.jsx";
import ProjectTypes from "./pages/Setup/ProjectTypes.jsx";
import ProjectTags from "./pages/Setup/ProjectTags.jsx";
import Status from "./pages/Setup/Status.jsx";
import InternalUser from "./pages/Setup/InternalUser";
import InternalDetails from "./components/Setup/Internal_Users/InternalDetails";
import ExternalTable from "./components/Setup/External_Users/ExternalTable";
import ProjectTable from "./components/Setup/Project/ProjectTable";
import ProjectDetail from "./components/Setup/Project/ProjectDetail";
import SprintTable from "./pages/Home/SprintTable.jsx";

import Login from "./pages/Login/Login";
import GroupTable from "./components/Setup/ProjectGroup/Table.jsx";
import ProjectGroup from "./pages/Setup/ProjectGroup.jsx";
import ProjectTemplates from "./pages/Setup/ProjectTemplates.jsx";
import toast, { Toaster } from "react-hot-toast";
import Table from "./components/Setup/Issues_Type/Table.jsx";
import IssuesType from "./pages/Setup/IssueType.jsx";
import SprintDetails from "./components/Home/Sprints/SprintDetails.jsx";
import Issues from "./pages/Home/Issues.jsx";
import Documents from "./pages/Home/Documents.jsx";
import IssueDetails from "./pages/Home/IssueDetails.jsx";
import MomDetails from "./pages/Home/MomDetails.jsx";
import Zone from "./pages/Setup/Zone.jsx";
import Region from "./pages/Setup/Region.jsx";
import Country from "./pages/Setup/Country.jsx";
import Company from "./pages/Setup/Company.jsx";
import Organizations from "./pages/Setup/Organizations.jsx";
import { WebSocketProvider } from "./contexts/WebSocketContext.jsx";
import MilestoneDetailsPage from "./pages/Home/MilestoneDetailsPage.jsx";
import DMConversation from "./components/Home/Channel/DMConversation.jsx";
import GroupConversation from "./components/Home/Channel/GroupConversation.jsx";
import Roster from "./pages/Setup/Roster";
import CreateRoster from "./pages/Setup/CreateRoster";
import EditRoster from "./pages/Setup/EditRoster";
import RosterDetails from "./pages/Setup/RosterDetails";
import Department from "./pages/Setup/Department";
import Sites from "./pages/Setup/Sites";
import Shift from "./pages/Setup/Shift";
import EmployeeAddPage from "./pages/Setup/EmployeeAddPage";
import { useWebSocket } from "./hooks/useWebSocket";
import { socketUrl } from "../apiDomain";
import Opportunity from "./pages/Home/Opportunity";
import OpportunityDetails from "./pages/Home/OpportunityDetails";
import ToDo from "./pages/Home/ToDo";

const App = () => {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const { manager: webSocketManager, connect } = useWebSocket();

  useEffect(() => {
    console.log('🔌 WebSocket connection effect running');

    if (token) {
      console.log('✅ Token available, connecting...');
      connect(token, socketUrl);
    } else {
      console.error('❌ No token available for WebSocket connection');
    }

    // return () => {
    //   console.log('🧹 Cleaning up WebSocket subscriptions');
    // };
  }, [token, connect]);

  useEffect(() => {
    const subscriptionTimer = setTimeout(() => {
      const sub = webSocketManager.subscribeToUserNotifications({
        onConnected: () => {
          console.log('🎉 SUBSCRIPTION SUCCESSFUL - Chat connected!');
          setIsSubscribed(true);
          toast.success('Real-time connection established!', { duration: 2000 });
        },
        onMessageNotification: (message, context) => {
          if (message.user_id === currentUser.id) {
            return;
          }

          if (!("Notification" in window)) {
            toast.error("Not supported");
            return;
          }

          Notification.requestPermission().then(permission => {
            if (permission === "granted") {
              const notification = new Notification("New message", {
                body: message.body
              });

              notification.onclick = () => {
                window.focus();
                navigate(`/channels/messages/${message.conversation_id}`);
              };
            }
          });
        },
        onDisconnected: () => {
          console.log('❌ Chat subscription disconnected');
          setIsSubscribed(false);
          toast.error('Real-time chat disconnected');
        }
      });
      console.log('📋 Subscription object:', sub);
    }, 2000); // Wait 2 seconds for connection to establish

    return () => {
      console.log('⏰ Clearing subscription timer');
      clearTimeout(subscriptionTimer);
    };
  }, [isSubscribed, webSocketManager, currentUser?.id]);

  return (
    <>
      {/* <WebSocketProvider accessToken={token} wsUrl={'wss://uat-tasks.lockated.com/cable'}> */}
      <Toaster />
      <Routes>
        {/* Login Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/cloud-projects-login" element={<Login />} />
        <Route path="/cloud-minutes-login" element={<Login />} />

        {/* All Routes - Layout will conditionally show/hide sidebar and header */}
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <Layout
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
              >
                <Routes>
                  {/* External Portal Routes */}
                  <Route path="/cloud-projects" element={<Projects />} />
                  <Route
                    path="/cloud-projects/:id"
                    element={<ProjectDetails />}
                  />
                  <Route
                    path="/cloud-projects/:id/milestones"
                    element={<MileStoneMain />}
                  />
                  <Route
                    path="/cloud-projects/:id/milestones/:mid/tasks"
                    element={<Tasks />}
                  />
                  <Route
                    path="/cloud-projects/:id/milestones/:mid/tasks/:tid"
                    element={<TaskDetails />}
                  />
                  <Route path="/cloud-minutes" element={<MinutesOfMeeting />} />
                  <Route path="/cloud-minutes/:id" element={<MomDetails />} />
                  <Route path="/cloud-minutes/new-mom" element={<MoMAdd />} />
                  <Route path="/cloud-tasks" element={<Tasks />} />
                  <Route path="/cloud-tasks/:tid" element={<TaskDetails />} />
                  <Route path="/cloud-issues" element={<Issues />} />
                  <Route path="/cloud-issues/:id" element={<IssueDetails />} />

                  {/* Internal Routes */}
                  <Route path="/" element={<Navigate to="/projects" />} />
                  <Route
                    path="projects/:id/milestones/:mid"
                    element={<MilestoneDetailsPage />}
                  />
                  <Route
                    path="/milestones/:mid"
                    element={<MilestoneDetailsPage />}
                  />
                  <Route
                    path="projects/:id/milestones/:mid/tasks"
                    element={<Tasks setIsSidebarOpen={setIsSidebarOpen} />}
                  />
                  <Route
                    path="/projects"
                    element={<Projects setIsSidebarOpen={setIsSidebarOpen} />}
                  />
                  <Route path="/projects/:id" element={<ProjectDetails />} />
                  <Route path="/sprint" element={<SprintTable />} />
                  <Route
                    path="/sprint/sprintdetails/:sid"
                    element={<SprintDetails />}
                  />
                  <Route path="/sprint/:id" element={<Sprints />} />
                  <Route
                    path="/projects/:id/milestones"
                    element={<MileStoneMain />}
                  />
                  <Route
                    path="/projects/:id/milestones/:mid/tasks/:tid"
                    element={<TaskDetails />}
                  />
                  <Route path="/tasks/:tid" element={<TaskDetails />} />
                  <Route
                    path="/tasks"
                    element={<Tasks setIsSidebarOpen={setIsSidebarOpen} />}
                  />
                  <Route
                    path="/issues"
                    element={<Issues setIsSidebarOpen={setIsSidebarOpen} />}
                  />
                  <Route path="/issues/:id" element={<IssueDetails />} />
                  <Route path="/mom" element={<MinutesOfMeeting />} />
                  <Route path="/mom/:id" element={<MomDetails />} />
                  <Route path="/new-mom" element={<MoMAdd />} />
                  <Route path="/opportunity" element={<Opportunity />} />
                  <Route path="/opportunity/:opportunityId" element={<OpportunityDetails />} />
                  <Route path="/todo" element={<ToDo />} />

                  {/* <Route path="/channels/*" element={<Channel />} /> */}
                  <Route path="/channels" element={<Channel />} >
                    <Route
                      index
                      element={
                        <div
                          className={`flex justify-center items-center h-[calc(100vh-59px)] w-[calc(100vw-30rem)]`}
                        >
                          Select a Chat/Group to view messages
                        </div>
                      }
                    />

                    <Route
                      path="/channels/messages/:id"
                      element={<DMConversation />}
                    />
                    <Route
                      path="/channels/groups/:id"
                      element={<GroupConversation />}
                    />
                  </Route>

                  <Route path="/documents" element={<Documents />} />

                  {/* Setup Routes */}
                  <Route
                    path="/setup"
                    element={<Navigate to="/setup/roles" />}
                  />
                  <Route path="/setup/roles" element={<Role />} />
                  <Route
                    path="/setup/internal-users"
                    element={<InternalUser />}
                  />
                  <Route
                    path="/setup/internal-users/add"
                    element={<EmployeeAddPage />}
                  />
                  <Route
                    path="/setup/internal-users/details/:id"
                    element={<Details />}
                  />
                  <Route
                    path="/setup/external-users"
                    element={<ExternalTable />}
                  />
                  <Route
                    path="/setup/shift"
                    element={<Shift />}
                  />
                  <Route
                    path="/setup/roster"
                    element={<Roster />}
                  />
                  <Route
                    path="/setup/roster/add-roster"
                    element={<CreateRoster />}
                  />
                  <Route
                    path="/setup/roster/edit/:id"
                    element={<EditRoster />}
                  />
                  <Route
                    path="/setup/roster/:id"
                    element={<RosterDetails />}
                  />
                  <Route
                    path="/setup/project-teams"
                    element={<ProjectTeams />}
                  />
                  <Route
                    path="/setup/project-teams/project-details"
                    element={<ProjectDetail />}
                  />
                  <Route
                    path="/setup/project-teams/details/:id"
                    element={<TeamDetails />}
                  />
                  <Route path="/setup/matrix" element={<EscalationMatrix />} />
                  <Route path="/setup/types" element={<ProjectTypes />} />
                  <Route path="/setup/tags" element={<ProjectTags />} />
                  <Route path="/setup/status" element={<Status />} />
                  <Route path="/setup/zone" element={<Zone />} />
                  <Route path="/setup/region" element={<Region />} />
                  <Route path="/setup/country" element={<Country />} />
                  <Route path="/setup/company" element={<Company />} />
                  <Route path="/setup/department" element={<Department />} />
                  <Route path="/setup/sites" element={<Sites />} />
                  <Route
                    path="/setup/organizations"
                    element={<Organizations />}
                  />
                  <Route
                    path="/setup/project-group"
                    element={<ProjectGroup />}
                  />
                  <Route
                    path="/setup/project-template"
                    element={<ProjectTemplates />}
                  />
                  <Route path="/setup/issues/types" element={<IssuesType />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
      {/* </WebSocketProvider> */}
    </>
  );
};

export default App;
