import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { baseURL } from '../../../apiDomain';

const createApiSlice = (name, fetchThunk) =>
  createSlice({
    name,
    initialState: {
      loading: false,
      success: false,
      error: null,
      [name]: [],
    },
    reducers: {
      resetCreateSuccess: (state) => {
        state.loading = false;
        state.success = false;
        state.error = null;
      },
      resetEditSuccess: (state) => {
        state.loading = false;
        state.success = false;
        state.error = null;
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

export const fetchDepartment = createAsyncThunk('fetchDepartment', async ({ token }) => {
  try {
    const response = await axios.get(`${baseURL}/departments.json`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.log(error);
    return error;
  }
});

export const createDepartment = createAsyncThunk('createDepartment', async ({ token, payload }) => {
  try {
    const response = await axios.post(`${baseURL}/departments.json`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.log(error);
    return error;
  }
});

export const updateDepartment = createAsyncThunk(
  'updateDepartment',
  async ({ token, payload, id }) => {
    try {
      const response = await axios.put(`${baseURL}/departments/${id}.json`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.log(error);
      return error;
    }
  }
);

export const deleteDepartment = createAsyncThunk('deleteDepartment', async ({ token, id }) => {
  try {
    const response = await axios.delete(`${baseURL}/departments/${id}.json`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.log(error);
    return error;
  }
});

export const fetchDepartmentSlice = createApiSlice('fetchDepartment', fetchDepartment);
export const createDepartmentSlice = createApiSlice('createDepartment', createDepartment);
export const updateDepartmentSlice = createApiSlice('updateDepartment', updateDepartment);
export const deleteDepartmentSlice = createApiSlice('deleteDepartment', deleteDepartment);

export const fetchDepartmentReducer = fetchDepartmentSlice.reducer;
export const createDepartmentReducer = createDepartmentSlice.reducer;
export const updateDepartmentReducer = updateDepartmentSlice.reducer;
export const deleteDepartmentReducer = deleteDepartmentSlice.reducer;

export const { resetCreateSuccess } = createDepartmentSlice.actions;
export const { resetEditSuccess } = updateDepartmentSlice.actions;
