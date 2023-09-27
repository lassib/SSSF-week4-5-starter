import {GraphQLError} from 'graphql';
import {Cat} from '../../interfaces/Cat';
import LoginMessageResponse from '../../interfaces/LoginMessageResponse';
import {User, UserIdWithToken} from '../../interfaces/User';
import dotenv from 'dotenv';
dotenv.config();
// TODO: create resolvers based on user.graphql
// note: when updating or deleting a user don't send id to the auth server, it will get it from the token
// note2: when updating or deleting a user as admin, you need to check if the user is an admin by checking the role from the user object

const userResolver = {
  Cat: {
    owner: async (cat: Cat) => {
      const response = await fetch(
        `${process.env.AUTH_URL}/users/${cat.owner}`
      );
      if (!response.ok) {
        throw new GraphQLError('Not authorized');
      }
      const user = (await response.json()) as User;
      return user;
    },
  },
  Query: {
    users: async () => {
      const response = await fetch(`${process.env.AUTH_URL}/users`);
      if (!response.ok) {
        throw new GraphQLError('Not authorized');
      }
      const users = (await response.json()) as User[];
      return users;
    },
    userById: async (_: unknown, user: {id: string}) => {
      const response = await fetch(`${process.env.AUTH_URL}/users/${user.id}`);
      if (!response.ok) {
        throw new GraphQLError(response.statusText);
      }
      const userById = (await response.json()) as User;
      return userById;
    },
    checkToken: async (_: unknown, __: unknown, user: UserIdWithToken) => {
      const response = await fetch(`${process.env.AUTH_URL}/users/token`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        throw new GraphQLError(response.statusText);
      }
      const userFromToken = (await response.json()) as User;
      return userFromToken;
    },
  },
  Mutation: {
    login: async (
      _: unknown,
      user: {credentials: {username: string; password: string}}
    ) => {
      const response = await fetch(`${process.env.AUTH_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify(user.credentials),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new GraphQLError(response.statusText);
      }
      const loginResponse = (await response.json()) as LoginMessageResponse;
      return loginResponse;
    },
    register: async (_: unknown, user: {user: User}) => {
      const response = await fetch(`${process.env.AUTH_URL}/users`, {
        method: 'POST',
        body: JSON.stringify(user.user),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new GraphQLError(response.statusText);
      }
      const registerResponse = (await response.json()) as LoginMessageResponse;
      return registerResponse;
    },
    updateUser: async (
      _: unknown,
      user: {user: User},
      userWithToken: UserIdWithToken
    ) => {
      if (!userWithToken.token) return null;
      const response = await fetch(`${process.env.AUTH_URL}/users`, {
        method: 'PUT',
        body: JSON.stringify(user.user),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userWithToken.token}`,
        },
      });
      if (!response.ok) {
        throw new GraphQLError(response.statusText);
      }
      const updateUser = (await response.json()) as LoginMessageResponse;
      return updateUser;
    },
    updateUserAsAdmin: async (
      _: unknown,
      user: User,
      userWithToken: UserIdWithToken
    ) => {
      if (!userWithToken.token || !userWithToken.role.includes('admin'))
        return null;
      const response = await fetch(`${process.env.AUTH_URL}/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify(user),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userWithToken.token}`,
          role: userWithToken.role,
        },
      });
      if (!response.ok) {
        throw new GraphQLError(response.statusText);
      }
      const updateUser = (await response.json()) as User;
      return updateUser;
    },
    deleteUser: async (_: unknown, __: unknown, user: UserIdWithToken) => {
      const response = await fetch(`${process.env.AUTH_URL}/users`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (!response.ok) {
        throw new GraphQLError(response.statusText);
      }
      const deleteUser = (await response.json()) as User;
      return deleteUser;
    },
    deleteUserAsAdmin: async (
      _: unknown,
      user: User,
      userWithToken: UserIdWithToken
    ) => {
      if (!userWithToken.token || !userWithToken.role.includes('admin'))
        return null;
      const response = await fetch(`${process.env.AUTH_URL}/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userWithToken.token}`,
          role: userWithToken.role,
        },
      });
      if (!response.ok) {
        throw new GraphQLError(response.statusText);
      }
      const deleteUser = (await response.json()) as User;
      return deleteUser;
    },
  },
};

export default userResolver;
