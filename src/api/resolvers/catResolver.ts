import {GraphQLError} from 'graphql';
import {Cat} from '../../interfaces/Cat';
import {locationInput} from '../../interfaces/Location';
import {UserIdWithToken} from '../../interfaces/User';
import rectangleBounds from '../../utils/rectangleBounds';
import catModel from '../models/catModel';
import {Types} from 'mongoose';

// TODO: create resolvers based on cat.graphql
// note: when updating or deleting a cat, you need to check if the user is the owner of the cat
// note2: when updating or deleting a cat as admin, you need to check if the user is an admin by checking the role from the user object
const catResolver = {
  Query: {
    cats: async () => {
      return await catModel.find();
    },
    catById: async (_: unknown, cat: Cat) => {
      return await catModel.findById(cat.id);
    },
    catsByOwner: async (_: unknown, userWithToken: UserIdWithToken) => {
      return await catModel.find({owner: userWithToken.id});
    },
    catsByArea: async (_: unknown, location: locationInput) => {
      const bounds = rectangleBounds(location.topRight, location.bottomLeft);
      return await catModel.find({
        location: {
          $geoWithin: {
            $geometry: bounds,
          },
        },
      });
    },
  },
  Mutation: {
    createCat: async (_: unknown, cat: Cat, user: UserIdWithToken) => {
      if (!user.token) null;
      cat.owner = user.id as unknown as Types.ObjectId;
      const newCat = new catModel({
        cat_name: cat.cat_name,
        weight: cat.weight,
        birthdate: cat.birthdate,
        filename: cat.filename,
        location: cat.location,
        owner: cat.owner,
      }) as Cat;
      const createCat = (await catModel.create(newCat)) as Cat;
      if (!createCat) {
        throw new GraphQLError('Cat not created');
      }
      return createCat;
    },
    updateCat: async (_: unknown, cat: Cat, user: UserIdWithToken) => {
      const catToUpdate = (await catModel.findById(cat.id)) as Cat;
      if (!user.token || catToUpdate.owner.toString() !== user.id) {
        throw new GraphQLError('Not authorized');
      }
      const updatedCat: Cat = (await catModel.findByIdAndUpdate(cat.id, cat, {
        new: true,
      })) as Cat;
      return updatedCat;
    },
    deleteCat: async (_: unknown, cat: Cat, user: UserIdWithToken) => {
      const catToDelete: Cat = (await catModel.findById(cat.id)) as Cat;
      if (!user.token || catToDelete.owner.toString() !== user.id) {
        throw new GraphQLError('Not authorized');
      }
      const deletedCat: Cat = (await catModel.findByIdAndDelete(cat.id)) as Cat;
      return deletedCat;
    },
    updateCatAsAdmin: async (_: unknown, cat: Cat, user: UserIdWithToken) => {
      if (!user.token || user.role !== 'admin') {
        throw new GraphQLError('Not authorized');
      }
      const updateCat: Cat = (await catModel.findByIdAndUpdate(cat.id, cat, {
        new: true,
      })) as Cat;
      return updateCat;
    },
    deleteCatAsAdmin: async (_: unknown, cat: Cat, user: UserIdWithToken) => {
      if (!user.token || user.role !== 'admin') {
        throw new GraphQLError('Not authorized');
      }
      const deletedCat: Cat = (await catModel.findByIdAndDelete(cat.id)) as Cat;
      return deletedCat;
    },
  },
};

export default catResolver;
