const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'The tour must have a name'],
      unique: true,
      trim: true, // delete the empty space in the beginning & end
      maxlength: [40, 'A tour must be less or equal to 40 characters'],
      minlength: [10, 'A tour must be more or equal to 10 characters'],
      // Validation library (npm i validator):
      // validate: [
      //   validator.isAlpha,
      //   'Tour name must include characters only (w/o a space)',
      // ],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'The tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'The tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'The tour must have a difficulty'],
      // validation:
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'The difficulty is either: east, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      // validation:
      max: [5, 'Rating cannot be more than 5'],
      min: [1, 'Rating cannot be less than 1'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: {
      type: Number,
      required: [true, 'The tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      // Custom validation:
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'The discount price must be less than the regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'The tour must have a summary'],
    },
    description: { type: String, trim: true },
    imageCover: {
      type: String,
      required: [true, 'The tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(), // mongo auto creates a normal date format
      select: false,
    },
    startDates: [Date],
    secretTour: { type: Boolean, default: false },
    startLocation: {
      // Geo JSON
      // .find query: $geoWithin ({ startLocation:... })
      // aggregation: $geoNear (type: Point)
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      adress: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        adress: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User', // get access to the 'User' model in mongoDB
      },
    ],
  },

  // Options for the schema:
  {
    // Convert for the output
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// -- Indexed (+perfomance) - special type of data structures (for mongoDB)

// ?price[lt]=1000&ratingsAverage[gt]=4.7
// .index( { criteria: 1 or -1 } ) AZ or ZA, traversal, sort order (fields store in db like hash tables)
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// -- Virtual propertiets (creating a new raw)

tourSchema.virtual('durationWeek').get(function () {
  return this.duration / 7;
});

// Virtual populate: Tours <- Reviews id (Parrent < Child)
// reviews: [ {}, {} ]
tourSchema.virtual('reviews', {
  ref: 'Review', // child
  foreignField: 'tour', // child ref
  localField: '_id', // find: _id in tour: ...
});

// -- Document middleware (this === curr Doc)

// 'pre' - before .start() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next(); // next middleware
});

// -- Query middleware (this === curr Query)

// regexp: all commands start with 'find' .find() .findOne()
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();

  next();
});

// faster!
// [id,id] > [{id...},{id...}] references for 'this.guides'
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt', // not show up
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took: ${Date.now() - this.start} ms`);
  next();
});

// -- Aggregation middleware (this === curr Aggreg object)

// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   console.log(this.pipeline()); // [ {$match...} , {$group...}, {$sort} ]
//   next();
// });

const Tour = new mongoose.model('Tour', tourSchema);
// Tour === Model

module.exports = Tour;
