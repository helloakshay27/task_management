import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
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
    reducers: {},
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

export const fetchSites = createAsyncThunk('fetchSites', async ({ token }) => {
  try {
    const response = await axios.get(`${baseURL}/sites.json`, {
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

export const createSite = createAsyncThunk('createSite', async ({ token, payload }) => {
  try {
    const response = await axios.post(`${baseURL}/sites.json`, payload, {
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

export const updateSite = createAsyncThunk('updateSite', async ({ token, payload, id }) => {
  try {
    const response = await axios.put(`${baseURL}/sites/${id}.json`, payload, {
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

export const deleteSite = createAsyncThunk('deleteSite', async ({ token, id }) => {
  try {
    const response = await axios.delete(`${baseURL}/sites/${id}.json`, {
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

export const createSiteSlice = createApiSlice('createSite', createSite);
export const updateSiteSlice = createApiSlice('updateSite', updateSite);
export const fetchSitesSlice = createApiSlice('fetchSites', fetchSites);
export const deleteSiteSlice = createApiSlice('deleteSite', deleteSite);

export const createSiteReducer = createSiteSlice.reducer;
export const updateSiteReducer = updateSiteSlice.reducer;
export const fetchSitesReducer = fetchSitesSlice.reducer;
export const deleteSiteReducer = deleteSiteSlice.reducer;
