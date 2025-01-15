import useSWR from "swr";
// import { useContext } from 'react';
// import { UserContext } from '../context/UserContext';
// import { setNativeRole, setEmulatedRole, setAvailableRoles } from "../context/userReducer";

const getDefaultRole = (user, allOrgs, allAgencies) => {

  // There's a clause below for each possible native role. They are checked in
  // descending order of "user strength": superadmin, org admin, org member, agency admin, agency member.
  // We'll also prepare choices in advance for the emulate role function (the modal) to
  // display as emulation options.

  // holdNativeRole holds the native role for the user. It has 3 props: admin, orgId, agencyId.
  // {true, null, null} indicates a superadmin. A superadmin cannot be connected to any org or agency,
  // except by emulation.
  // Anyone else is connected to an org or an agency as admin or member. Remember, this is
  // a descending strength determination. Once we find a match, we stop searching.
  let holdNativeRole = {}

  // accumRoles is an array of emulation choices. These are the choices the user can
  // make in the emulate role function. Each array element is an object with 2 props:
  // displayName, and eRole where eRole is an object that looks like holdNativeRole.
  // In fact, when a user is emulating, the selected eRole is used in place of holdNativeRole.
  // When the user exits emulation mode, holdNativeRole is used again.
  const accumRoles = []

  // Determine and return user's default role along with an array of emulation choices.
  // This is done in descending order by "user strength".

  // 1. super admin
  if (user.superAdmin) {

    // We already know enough to set a superadmin's native role.
    holdNativeRole = {
      admin: true,
      orgId: null,
      agencyId: null
    }
    // A superAdmin gets 2 choices for each org or agency in the database: admin and member.
    allOrgs?.forEach(org => {
      accumRoles.push({
        displayName: `${org.name} admin`,
        eRole: {
          admin: true,
          orgId: org.id,
          agencyId: null
        }
      })
      accumRoles.push({
        displayName: `${org.name} member`,
        eRole: {
          admin: false,
          orgId: org.id,
          agencyId: null
        }
      })
    })
    allAgencies?.forEach(ag => {
      accumRoles.push({
        displayName: `${ag.name} admin`,
        eRole: {
          admin: true,
          orgId: null,
          agencyId: ag.id
        }
      })
      accumRoles.push({
        displayName: `${ag.name} member`,
        eRole: {
          admin: false,
          orgId: null,
          agencyId: ag.id
        }
      })
    })
    return {
      role: { ...holdNativeRole },
      ec: [...accumRoles]
    }
  }

  // 2. The user is not a super admin. holdNativeRole is not set yet. Nothing has been added to accumRoles.
  //    A user can be admin of 0, 1 or multiple orgs (although being admin of multiple orgss is highly unlikely).
  //    If a user is an org admin, set native role and then set up accumRoles.
  user.orgs.forEach(orgInUser => {

    // We're doing a forEach over the user's orgs array. Each one represents an org for which user is an admin or a member.
    // We use the first of these orgs for which user as an org admin. When we find that "org", we collect data,
    // and stop the loop by returning results.
    // Although orgInUser came from the user.orgs prop, it's not really an org. Only a couple of its fields can be used.
    // Here's a rundown of properties that can be trusted and those that cannot:
    //   id - this is not the org id; it's the useless id from usersonorgs
    //   isOrgAdmin - this is true if user is the org admin of org
    //   org - this object holds some useful, trustable org data:
    //     active
    //     id - this is the id of the org represented by orgInUser
    //     name - and this is the org's name
    //   orgId - this is the org id of the org in orgInUser.org
    //   usedId - this is the actual user's id

    if (orgInUser.isOrgAdmin) {
      // Since we're in a loop over all of the orgs inside user, we need to check if holdNativeRole
      // is empty before setting it, because it could have been set earlier in the loop.
      if (Object.keys(holdNativeRole).length === 0) {
        holdNativeRole = {
          admin: true,
          orgId: orgInUser.orgId,
          agencyId: null
        }
      }
      // Then add emulation choices to accumRoles. Some will be added for each org
      // of which user is orgAdmin, which is fortunate because that's what we're looping through.
      // What gets added? Agency admin and member for each of org's agencies.
      // Remember, agency-related roles aren't emulateable unless the agency is related to
      // the org that the user is connected to.
      // We would like to use the agencies array in orgInUser, but it's not there, so we
      // have to use the more complete org in allOrgs.
      const moreCompleteOrg = allOrgs.find(org => org.id === orgInUser.orgId) // cannot fail
      moreCompleteOrg.agencies.forEach(agencyInOrg => {
        accumRoles.push({
          displayName: `${agencyInOrg.agency.name} admin`,
          eRole: {
            admin: true,
            orgId: null, // orgInUser.orgId,
            agencyId: agencyInOrg.agency.id
          }
        })
        accumRoles.push({
          displayName: `${agencyInOrg.agency.name} member`,
          eRole: {
            admin: false,
            orgId: null, // orgInUser.orgId,
            agencyId: agencyInOrg.agency.id
          }
        })
      })
    }
  })
  if (Object.keys(holdNativeRole).length > 0) {

    return {
      role: { ...holdNativeRole },
      ec: [...accumRoles]
    }
  }

  // 3. The user is not a super admin or an org admin. The user must be an agency admin or member.
  //    holdNativeRole is not set yet. Neither is accumRoles.
  //    A user can be admin of 0, 1 or multiple agencies (although multiples are highly unlikely).
  //    If a user is an agency admin, set native role and then set up accumRoles.
  //    We don't have to look up the agency in allAgencies like in case 2, since we're kind-of at the bottom already.
  user.agencies.forEach(agencyInUser => {
    if (agencyInUser.isAgencyAdmin) {
      if (Object.keys(holdNativeRole).length === 0) {
        holdNativeRole = {
          admin: true,
          orgId: null,
          agencyId: agencyInUser.agencyId
        }
      }
      // Then add emulation choices to accumRoles. This is very simple. The only emulation
      // choices are to become a member of the same agency of which user is agency admin.
      accumRoles.push({
        displayName: `${agencyInUser.agency.name} member`,
        eRole: {
          admin: false,
          orgId: null,
          agencyId: agencyInUser.agencyId
        }
      })
    }
  })
  if (Object.keys(holdNativeRole).length > 0) {

    return {
      role: { ...holdNativeRole },
      ec: [...accumRoles]
    }
  }

  // 4. A user who is still moving down the role hierarchy is, at this point, not a
  //    super admin or an org or agency admin. A user who hasn't entered a token yet
  //    can be a member of no org or admin yet, but anyone who has entered a token
  //    is a member of something and so has a native role. But they cannot emulate anyone.
  let holdOrgInUser = null;
  user.orgs.forEach(orgInUser => {
    if (orgInUser.orgId.length > 0 && holdOrgInUser === null) {
      holdOrgInUser = orgInUser
    }
  })
  if (holdOrgInUser !== null) {
    return {
      role: {
        admin: false,
        agencyId: null,
        orgId: holdOrgInUser.orgId,
      },
      ec: []
    }
  }

  // 5. any agency (non-admin) member
  let holdAgencyInUser = null;
  user.agencies.forEach(agencyInUser => {
    if (agencyInUser.agencyId.length > 0 && holdAgencyInUser === null) {
      holdAgencyInUser = agencyInUser
    }
  })
  if (holdAgencyInUser !== null) {
    return {
      role: {
        admin: false,
        agencyId: holdAgencyInUser.agencyId,
        orgId: null,
      },
      ec: []
    }
  }

  // Fall-through case.
  return {
    role: {
      admin: false,
      agencyId: null,
      orgId: null,
    },
    ec: []
  }
}

export function useUser(userId) {

  const { data: agencyResponse, error: agencyResponseError, isLoading: agencyResponseIsLoading } = useSWR(`/api/agencies`)
  const { data: orgResponse, error: orgResponseError, isLoading: orgResponseIsLoading } = useSWR(`/api/orgs`)
  const { data, error, mutate } = useSWR(userId ? `/api/users/${userId}` : null)

  const allAgencies = agencyResponse?.agencies;
  const allOrgs = orgResponse?.orgs;

  if (!data) {
    return { isLoading: true }
  }

  if (data.status === "success") {
    const user = data.user;
    // user will have arrays of orgs and agencies with which the user is associated.

    // Each org in the array user.orgs will have an array of agencies with which the org is linked,
    // but the retrieval doesn't have to go farther than that.

    // Each array in the array user.arrays will have an array of agencies with which the org is associated,
    // but the retrieval doesn't have to go farther than that.
    const { role, ec } = getDefaultRole(user, allOrgs, allAgencies);
    return { user, mutate, role, ec };
  }

  return { error }
}
