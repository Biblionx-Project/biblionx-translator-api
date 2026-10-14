import { Schema, model } from 'mongoose';
import { VALIDATION_VALUES } from '../../config/validation';

const options = {
  timestamps: true,
  versionKey: false,
};

const reviewSchema = new Schema({
  text: {
    type: String,
    required: true,
  },

  translation: {
    type: String,
    required: true,
  },

  rating: {
    type: String,
    enum: VALIDATION_VALUES.ratingOptions,
    required: true,
  },

  review: String,

  requester: {
    type: String,
    required: true,
  },
}, options);

reviewSchema.pre('save', function toUpper() {
  if (this.translation) this.translation = this.translation.toUpperCase();
  if (this.review) this.review = this.review.toUpperCase();
});

const Review = model('Review', reviewSchema);

export default Review;
