import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { baseURL } from '../../../apiDomain';

export const createMilestone = createAsyncThunk(
  'createMilestone',
  async ({ token, payload }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${baseURL}/milestones.json`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  }
);

export const fetchMilestone = createAsyncThunk('fetchMilestone', async ({ token, id }) => {
  try {
    const response = await axios.get(
      `${baseURL}/milestones.json?q[project_management_id_eq]=${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
    return error.response.data;
  }
});

export const fetchMilestoneById = createAsyncThunk('fetchMilestoneById', async ({ token, id }) => {
  try {
    const response = await axios.get(`${baseURL}/milestones/${id}.json`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.log(error);
    return error.response.data;
  }
});

export const updateMilestone = createAsyncThunk(
  'updateMilestone',
  async ({ token, id, payload }) => {
    try {
      const response = await axios.put(`${baseURL}/milestones/${id}.json`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.log(error);
      return error.response.data;
    }
  }
);

export const fetchDependentMilestone = createAsyncThunk(
  'fetchDependentMilestone',
  async ({ token, id }) => {
    try {
      const response = await axios.get(`${baseURL}/milestones/${id}/dependent_milestones.json`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.log(error);
      return error.response.data;
    }
  }
);

export const deleteMilestone = createAsyncThunk('deleteMilestone', async ({ token, id }) => {
  try {
    const response = await axios.delete(`${baseURL}/milestones/${id}.json`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.log(error);
    return error.response.data;
  }
});

// ✅ Enhanced API slice factory
const createApiSlice = (name, fetchThunk, extraInitial = {}, extraReducers = {}) =>
  createSlice({
    name,
    initialState: {
      loading: false,
      success: false,
      error: null,
      [name]: [],
      ...extraInitial,
    },
    reducers: {
      ...extraReducers,
      resetMilestoneSuccess: (state) => {
        state.success = false;
      },
    },
    extraReducers: (builder) => {
      builder
        .addCase(fetchThunk.pending, (state) => {
          state.loading = true;
          state.success = false;
          state.error = null;
        })
        .addCase(fetchThunk.fulfilled, (state, action) => {
          state.loading = false;
          state.success = true;
          state.error = null;
          state[name] = action.payload;
        })
        .addCase(fetchThunk.rejected, (state, action) => {
          state.loading = false;
          state.success = false;
          state.error = action.payload || action.error.message;
        });
    },
  });

// ✅ fetchMilestone slice — with savedMilestones global state
export const fetchMilestoneSlice = createApiSlice(
  'fetchMilestone',
  fetchMilestone,
  {
    savedMilestones: [], // ← NEW global state
  },
  {
    // Reducers for saved milestone handling
    addSavedMilestone: (state, action) => {
      state.savedMilestones.push(action.payload);
    },
    setSavedMilestones: (state, action) => {
      state.savedMilestones = action.payload;
    },
    clearSavedMilestones: (state) => {
      state.savedMilestones = [];
    },
  }
);

// ✅ Other slices remain the same
export const createMilestoneSlice = createApiSlice('createMilestone', createMilestone);
export const fetchMilestoneByIdSlice = createApiSlice('fetchMilestoneById', fetchMilestoneById);
export const deleteMilestoneSlice = createApiSlice('deleteMilestone', deleteMilestone);
export const updateMilestoneSlice = createApiSlice('updateMilestone', updateMilestone);
export const fetchDependentMilestoneSlice = createApiSlice(
  'fetchDependentMilestone',
  fetchDependentMilestone
);

// ✅ Export reducers
export const createMilestoneReducer = createMilestoneSlice.reducer;
export const fetchMilestoneReducer = fetchMilestoneSlice.reducer;
export const fetchMilestoneByIdReducer = fetchMilestoneByIdSlice.reducer;
export const deleteMilestoneReducer = deleteMilestoneSlice.reducer;
export const updateMilestoneReducer = updateMilestoneSlice.reducer;
export const fetchDependentMilestoneReducer = fetchDependentMilestoneSlice.reducer;

// ✅ Export saved milestone actions
export const { addSavedMilestone, setSavedMilestones, clearSavedMilestones } =
  fetchMilestoneSlice.actions;

export const { resetMilestoneSuccess } = createMilestoneSlice.actions;
