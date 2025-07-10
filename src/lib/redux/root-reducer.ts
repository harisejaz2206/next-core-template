import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '@/@redux/features/auth/auth.slice';
import { apiSlice } from '@/@redux/features/api/api.slice';

const rootReducer = combineReducers({
  auth: authReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
  // Add other feature slices here
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer; 