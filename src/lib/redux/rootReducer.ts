import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '@/@redux/features/auth/auth.slice';

const rootReducer = combineReducers({
  auth: authReducer,
  // Add other feature slices here
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer; 