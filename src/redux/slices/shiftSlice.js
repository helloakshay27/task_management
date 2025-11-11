import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { baseURL } from "../../../apiDomain";

// Fetch Shifts
export const fetchShift = createAsyncThunk(
  "fetchShift",
  async ({ token }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${baseURL}/user_shifts.json`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch shifts"
      );
    }
  }
);

// Create Shift
export const createShift = createAsyncThunk(
  "createShift",
  async ({ token, payload }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${baseURL}/user_shifts.json`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to create shift" }
      );
    }
  }
);

// Update Shift
export const updateShift = createAsyncThunk(
  "updateShift",
  async ({ token, id, payload }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${baseURL}/user_shifts/${id}.json`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to update shift" }
      );
    }
  }
);

// Delete Shift
export const deleteShift = createAsyncThunk(
  "deleteShift",
  async ({ token, id }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${baseURL}/user_shifts/${id}.json`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete shift"
      );
    }
  }
);

// Fetch Shift Slice
const fetchShiftSlice = createSlice({
  name: "fetchShift",
  initialState: {
    loading: false,
    fetchShift: [],
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchShift.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShift.fulfilled, (state, action) => {
        state.loading = false;
        state.fetchShift = action.payload.user_shifts || action.payload;
      })
      .addCase(fetchShift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch shifts";
      });
  },
});

// Create Shift Slice
const createShiftSlice = createSlice({
  name: "createShift",
  initialState: {
    loading: false,
    createShift: null,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createShift.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createShift.fulfilled, (state, action) => {
        state.loading = false;
        state.createShift = action.payload;
      })
      .addCase(createShift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create shift";
      });
  },
});

// Update Shift Slice
const updateShiftSlice = createSlice({
  name: "updateShift",
  initialState: {
    loading: false,
    updateShift: null,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(updateShift.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateShift.fulfilled, (state, action) => {
        state.loading = false;
        state.updateShift = action.payload;
      })
      .addCase(updateShift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update shift";
      });
  },
});

// Delete Shift Slice
const deleteShiftSlice = createSlice({
  name: "deleteShift",
  initialState: {
    loading: false,
    deleteShift: null,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(deleteShift.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteShift.fulfilled, (state, action) => {
        state.loading = false;
        state.deleteShift = action.payload;
      })
      .addCase(deleteShift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to delete shift";
      });
  },
});

export const fetchShiftReducer = fetchShiftSlice.reducer;
export const createShiftReducer = createShiftSlice.reducer;
export const updateShiftReducer = updateShiftSlice.reducer;
export const deleteShiftReducer = deleteShiftSlice.reducer;
