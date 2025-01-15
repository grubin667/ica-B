'use client';

import { createContext, useContext, useReducer } from 'react';
import { userReducer, initialState, initializer } from './userReducer';

export const UserContext = createContext()

export const UserProvider = ({ children }) => {

  const [state, update] = useReducer(
    userReducer,
    initialState,
    initializer // 3rd param likely not needed here
  )

  return (
    <UserContext.Provider
      value={{
        state,
        update
      }}
    >
      {children}
    </UserContext.Provider>
  )
}