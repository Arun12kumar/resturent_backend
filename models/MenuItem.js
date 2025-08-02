const mongoose = require('mongoose');
const slugify = require('slugify');

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name for the menu item'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
      unique: true,
    },
    slug: String,
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      min: [0, 'Price must be at least 0'],
    },
    category: {
      type: String,
      required: [true, 'Please add a category'],
      enum: [
        'appetizer',
        'main',
        'dessert',
        'beverage',
        'special',
        'breakfast',
        'lunch',
        'dinner',
      ],
    },
    ingredients: {
      type: [String],
      required: [true, 'Please add at least one ingredient'],
    },
    dietaryTags: {
      type: [String],
      enum: [
        'vegetarian',
        'vegan',
        'gluten-free',
        'dairy-free',
        'nut-free',
        'spicy',
      ],
    },
    image: {
      type: String,
      default: 'no-photo.jpg',
    },
    featured: {
      type: Boolean,
      default: false,
    },
    available: {
      type: Boolean,
      default: true,
    },
    preparationTime: {
      type: Number,
      min: [0, 'Preparation time must be at least 0 minutes'],
    },
    calories: {
      type: Number,
      min: [0, 'Calories must be at least 0'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create menu item slug from the name
menuItemSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Cascade delete reviews when a menu item is deleted
menuItemSchema.pre('remove', async function (next) {
  await this.model('Review').deleteMany({ menuItem: this._id });
  next();
});

// Reverse populate with virtuals for reviews
menuItemSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'menuItem',
  justOne: false,
});

// Static method to get average price of menu items
menuItemSchema.statics.getAveragePrice = async function (category) {
  const obj = await this.aggregate([
    {
      $match: { category },
    },
    {
      $group: {
        _id: '$category',
        averagePrice: { $avg: '$price' },
      },
    },
  ]);

  try {
    await this.model('Category').findOneAndUpdate(
      { name: category },
      {
        averagePrice: Math.ceil(obj[0]?.averagePrice || 0),
      }
    );
  } catch (err) {
    console.error(err);
  }
};

// Call getAveragePrice after save
menuItemSchema.post('save', function () {
  this.constructor.getAveragePrice(this.category);
});

// Call getAveragePrice after remove
menuItemSchema.post('remove', function () {
  this.constructor.getAveragePrice(this.category);
});

module.exports = mongoose.model('MenuItem', menuItemSchema);