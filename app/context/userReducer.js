export const initialState = {
  emulatedRole: {}, // will be empty if user isn't emulating right now
}

export const initializer = (initialValue = initialState) => {
  return initialValue;
}

export const userReducer = (state, action) => {

  switch (action.type) {

    case "SET_EMULATED_ROLE":
      return {
        ...state,
        emulatedRole: action.role
      }
  }
}

export const setEmulatedRole = (role) => ({
  type: "SET_EMULATED_ROLE",
  role
})
