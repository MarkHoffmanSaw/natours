const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

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
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// -- Virtual propertiets (creating a new raw)

tourSchema.virtual('durationWeek').get(function () {
  return this.duration / 7;
});

// -- Document middleware (this === curr Doc)

// 'pre' - before .start() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next(); // next middleware
});

// 'post' - after save
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// -- Query middleware (this === curr Query)

// regexp: all commands start with 'find' .find() .findOne()
// tourSchema.pre(/^find/, function (next) {
//   this.find({ secretTour: { $ne: true } });

//   this.start = Date.now();
//   next();
// });

// tourSchema.post(/^find/, function (docs, next) {
//   console.log(`Query's time: ${Date.now() - this.start} ms`);
//   console.log(docs);
//   next();
// });

// -- Aggregation middleware (this === curr Aggreg object)

// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   console.log(this.pipeline()); // [ {$match...} , {$group...}, {$sort} ]
//   next();
// });

const Tour = new mongoose.model('Tour', tourSchema);
// Tour === Model

module.exports = Tour;
