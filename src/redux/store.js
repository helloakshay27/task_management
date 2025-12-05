import { configureStore } from '@reduxjs/toolkit';
import {
  changeProjectStatusReducer,
  deleteProjectGroupReducer,
  deleteProjectTeamReducer,
  createProjectReducer,
  createProjectTypesReducer,
  deleteProjectReducer,
  editProjectReducer,
  fetchProjectDetailsReducer,
  fetchProjectsReducer,
  fetchProjectTypeReducer,
  fetchTemplatesReducer,
  filterProjectsReducer,
  updateProjectTypeReducer,
  fetchProjectGroupReducer,
  createProjectGroupReducer,
  updateProjectGroupReducer,
  createProjectTeamReducer,
  fetchProjectTeamsReducer,
  fetchProjectTeamReducer,
  updateProjectTeamReducer,
  removeTagFromProjectReducer,
  removeMembersFromTeamReducer,
  fetchActiveProjectTypesReducer,
  removeAttachmentReducer,
  fetchProjectTeamMembersReducer,
  fetchKanbanProjectsReducer,
} from './slices/projectSlice';
import {
  createExternalUserReducer,
  createInternalUserReducer,
  fetchAssociatedProjectsReducer,
  fetchExternalUserReducer,
  fetchInternalUserDetailsReducer,
  fetchInternalUserReducer,
  fetchUpdatelUserReducer,
  fetchUserAvailabilityReducer,
  fetchUserShiftReducer,
  reassignProjectsReducer,
  removeUserFromProjectReducer,
  userReducer,
} from './slices/userSlice';
import {
  createTagReducer,
  deleteTagReducer,
  fetchActiveTagsReducer,
  fetchTagsReducer,
  updateTagReducer,
} from './slices/tagsSlice';
import {
  createRoleReducer,
  deleteRoleReducer,
  editRoleReducer,
  fetchActiveRolesReducer,
  fetchRolesReducer,
} from './slices/roleSlice';
import {
  changeTaskStatusReducer,
  createDependancyReducer,
  createTaskCommentReducer,
  fetchMyTasksReducer,
  createTaskReducer,
  editTaskCommentReducer,
  editTaskReducer,
  fetchTasksOfProjectReducer,
  fetchTasksReducer,
  filterTaskReducer,
  taskDetailsReducer,
  updateDependancyReducer,
  deleteTaskCommentReducer,
  fetchTasksOfMilestoneReducer,
  removeTaskAttachmentReducer,
  fetchKanbanTasksReducer,
  deleteDependancyReducer,
  fetchTargetDateTasksReducer,
  fetchKanbanTasksOfProjectReducer,
} from './slices/taskSlice';
import {
  createOrganizationReducer,
  editOrganizationReducer,
  fetchOrganizationsReducer,
} from './slices/organizationSlice';
import {
  createMilestoneReducer,
  deleteMilestoneReducer,
  fetchDependentMilestoneReducer,
  fetchMilestoneByIdReducer,
  fetchMilestoneReducer,
  updateMilestoneReducer,
} from './slices/milestoneSlice';
import {
  fetchSpirintByIdReducer,
  fetchSpirintsReducer,
  postSprintReducer,
  putSprintReducer,
} from './slices/spirintSlice';
import {
  createIssueReducer,
  fetchIssueReducer,
  updateIssueReducer,
  fetchIssueTypeReducer,
  filterIssueReducer,
  createIssueTypeReducer,
  updateIssueTypeReducer,
  deleteIssueTypeReducer,
  removeIssueAttachmentReducer,
  fetchIssueByIdReducer,
} from './slices/IssueSlice';
import { fetchStatusReducer, createStatusReducer, updateStatusReducer } from './slices/statusSlice';
import {
  createMoMReducer,
  fetchMomDetailsReducer,
  fetchMoMReducer,
  removeMomAttachmentReducer,
} from './slices/momSlice';
import {
  createMessageReducer,
  fetchChannelByIdReducer,
  fetchChannelsReducer,
  fetchConversationsReducer,
  fetchMessagesOfConversationReducer,
  startConversationReducer,
  updateMessageReducer,
} from './slices/channelSlice';
import {
  createCompanyReducer,
  editCompanyReducer,
  fetchCompanyReducer,
} from './slices/companySlice';
import {
  createRegionReducer,
  updateRegionReducer,
  fetchRegionReducer,
  deleteRegionReducer,
} from './slices/regionSlice';
import {
  createZoneReducer,
  updateZoneReducer,
  fetchZoneReducer,
  deleteZoneReducer,
} from './slices/zoneSlice';
import {
  createCountryReducer,
  updateCountryReducer,
  fetchCountryReducer,
  deleteCountryReducer,
} from './slices/countrySlice';
import {
  createDepartmentReducer,
  updateDepartmentReducer,
  fetchDepartmentReducer,
  deleteDepartmentReducer,
} from './slices/departmentSlice';
import {
  createSiteReducer,
  deleteSiteReducer,
  fetchSitesReducer,
  updateSiteReducer,
} from './slices/siteSlice';
import {
  createShiftReducer,
  updateShiftReducer,
  fetchShiftReducer,
  deleteShiftReducer,
} from './slices/shiftSlice';

export const store = configureStore({
  reducer: {
    //projects
    createProject: createProjectReducer,
    fetchProjects: fetchProjectsReducer,
    fetchKanbanProjects: fetchKanbanProjectsReducer,
    fetchProjectDetails: fetchProjectDetailsReducer,
    changeProjectStatus: changeProjectStatusReducer,
    editProject: editProjectReducer,
    fetchProjectTypes: fetchProjectTypeReducer,
    fetchActiveProjectTypes: fetchActiveProjectTypesReducer,
    createdProjectTypes: createProjectTypesReducer,
    fetchTemplates: fetchTemplatesReducer,
    deleteProject: deleteProjectReducer,
    updateProjectType: updateProjectTypeReducer,
    deleteProjectType: deleteProjectReducer,
    filterProjects: filterProjectsReducer,
    createProjectGroup: createProjectGroupReducer,
    updateProjectGroup: updateProjectGroupReducer,
    fetchProjectGroup: fetchProjectGroupReducer,
    createProjectTeam: createProjectTeamReducer,
    fetchProjectTeams: fetchProjectTeamsReducer,
    fetchProjectTeam: fetchProjectTeamReducer,
    updateProjectTeam: updateProjectTeamReducer,
    removeTagFromProject: removeTagFromProjectReducer,
    removeMembersFromTeam: removeMembersFromTeamReducer,
    removeMembersFromGroup: removeTagFromProjectReducer,
    deleteProjectTeam: deleteProjectTeamReducer,
    deleteProjectGroup: deleteProjectGroupReducer,
    removeAttachment: removeAttachmentReducer,
    fetchProjectTeamMembers: fetchProjectTeamMembersReducer,

    //tasks
    createTask: createTaskReducer,
    fetchTasks: fetchTasksReducer,
    editTask: editTaskReducer,
    taskDetails: taskDetailsReducer,
    changeTaskStatus: changeTaskStatusReducer,
    filterTask: filterTaskReducer,
    createDependancy: createDependancyReducer,
    updateDependancy: updateDependancyReducer,
    fetchMyTasks: fetchMyTasksReducer,
    fetchTasksOfMilestone: fetchTasksOfMilestoneReducer,
    removeTaskAttachment: removeTaskAttachmentReducer,
    fetchKanbanTasks: fetchKanbanTasksReducer,
    deleteDependancy: deleteDependancyReducer,
    fetchTargetDateTasks: fetchTargetDateTasksReducer,
    fetchKanbanTasksOfProject: fetchKanbanTasksOfProjectReducer,

    //issues
    createIssue: createIssueReducer,
    fetchIssues: fetchIssueReducer,
    updateIssues: updateIssueReducer,
    fetchIssueType: fetchIssueTypeReducer,
    createIssueType: createIssueTypeReducer,
    updateIssueType: updateIssueTypeReducer,
    deleteIssueType: deleteIssueTypeReducer,
    filterIssue: filterIssueReducer,
    removeIssueAttachment: removeIssueAttachmentReducer,
    fetchIssueById: fetchIssueByIdReducer,

    // fetchTasksComments: fetchTasksCommentsReducer,
    createTaskComment: createTaskCommentReducer,
    editTaskComment: editTaskCommentReducer,
    deleteTaskComment: deleteTaskCommentReducer,
    fetchTasksOfProject: fetchTasksOfProjectReducer,

    //Milestone
    createMilestone: createMilestoneReducer,
    fetchMilestone: fetchMilestoneReducer,
    fetchMilestoneById: fetchMilestoneByIdReducer,
    deleteMilestone: deleteMilestoneReducer,
    updateMilestone: updateMilestoneReducer,
    fetchDependentMilestone: fetchDependentMilestoneReducer,

    //region
    createRegion: createRegionReducer,
    fetchRegion: fetchRegionReducer,
    updateRegion: updateRegionReducer,
    deleteRegion: deleteRegionReducer,

    //zones
    createZone: createZoneReducer,
    fetchZone: fetchZoneReducer,
    updateZone: updateZoneReducer,
    deleteZone: deleteZoneReducer,

    //roles
    createRole: createRoleReducer,
    fetchRoles: fetchRolesReducer,
    fetchActiveRoles: fetchActiveRolesReducer,
    editRole: editRoleReducer,
    deleteRole: deleteRoleReducer,

    //status
    fetchStatus: fetchStatusReducer,
    createStatus: createStatusReducer,
    updateStatus: updateStatusReducer,
    deleteStatus: deleteRoleReducer,

    //users
    fetchUsers: userReducer,
    createInternalUser: createInternalUserReducer,
    fetchInternalUser: fetchInternalUserReducer,
    createExternalUser: createExternalUserReducer,
    fetchExternalUser: fetchExternalUserReducer,
    fetchUpdateUser: fetchUpdatelUserReducer,
    fetchInternalUserDetails: fetchInternalUserDetailsReducer,
    removeUserFromProject: removeUserFromProjectReducer,
    fetchAssociatedProjects: fetchAssociatedProjectsReducer,
    reassignProjects: reassignProjectsReducer,
    fetchUserAvailability: fetchUserAvailabilityReducer,
    fetchUserShift: fetchUserShiftReducer,

    //tags
    fetchTags: fetchTagsReducer,
    fetchActiveTags: fetchActiveTagsReducer,
    createTag: createTagReducer,
    updateTag: updateTagReducer,
    deleteTag: deleteTagReducer,

    //organizations
    fetchOrganizations: fetchOrganizationsReducer,
    createOrganization: createOrganizationReducer,
    editOrganization: editOrganizationReducer,

    //Company
    createCompany: createCompanyReducer,
    fetchCompany: fetchCompanyReducer,
    editCompany: editCompanyReducer,

    //Country
    fetchCountry: fetchCountryReducer,
    createCountry: createCountryReducer,
    updateCountry: updateCountryReducer,
    deleteCountry: deleteCountryReducer,

    //Department
    fetchDepartment: fetchDepartmentReducer,
    createDepartment: createDepartmentReducer,
    updateDepartment: updateDepartmentReducer,
    deleteDepartment: deleteDepartmentReducer,

    //Shift
    fetchShift: fetchShiftReducer,
    createShift: createShiftReducer,
    updateShift: updateShiftReducer,
    deleteShift: deleteShiftReducer,

    //Sites
    createSite: createSiteReducer,
    updateSite: updateSiteReducer,
    fetchSites: fetchSitesReducer,
    deleteSite: deleteSiteReducer,

    //Spirints
    fetchSpirints: fetchSpirintsReducer,
    postSprint: postSprintReducer,
    putSprint: putSprintReducer,
    fetchSpirintById: fetchSpirintByIdReducer,

    //MoM
    fetchMoM: fetchMoMReducer,
    createMoM: createMoMReducer,
    fetchMomDetails: fetchMomDetailsReducer,
    removeMomAttachment: removeMomAttachmentReducer,

    //Channels
    fetchChannels: fetchChannelsReducer,
    fetchConversations: fetchConversationsReducer,
    fetchChannelById: fetchChannelByIdReducer,
    createMessage: createMessageReducer,
    startConversation: startConversationReducer,
    fetchMessagesOfConversation: fetchMessagesOfConversationReducer,
    updateMessage: updateMessageReducer,
  },
});
