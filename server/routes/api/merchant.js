const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Bring in Models & Helpers
const { MERCHANT_STATUS, ROLES } = require('../../constants');
const Merchant = require('../../models/merchant');
const User = require('../../models/user');
const Brand = require('../../models/brand');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const nodemailer = require('../../services/nodemailer');

// add merchant api
router.post('/add', async (req, res) => {
  try {
    const { name, business, phoneNumber, email, brandName } = req.body;

    if (!name || !email) {
      return res
        .status(400)
        .json({ error: 'You must enter your name and email.' });
    }

    if (!business) {
      return res
        .status(400)
        .json({ error: 'You must enter a business description.' });
    }

    if (!phoneNumber || !email) {
      return res
        .status(400)
        .json({ error: 'You must enter a phone number and an email address.' });
    }

    const existingMerchant = await Merchant.findOne({ email });

    if (existingMerchant) {
      return res
        .status(400)
        .json({ error: 'That email address is already in use.' });
    }

    const merchant = new Merchant({
      name,
      email,
      business,
      phoneNumber,
      brandName
    });
    const merchantDoc = await merchant.save();

    await nodemailer.sendEmail(email, 'merchant-application');

    res.status(200).json({
      success: true,
      message: `We received your request! we will reach you on your email ${email}!`,
      merchant: merchantDoc
    });
  } catch (error) {
    return res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// search merchants api
router.get('/search', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const { search } = req.query;

    const regex = new RegExp(search, 'i');

    const merchants = await Merchant.find({
      $or: [
        { phoneNumber: { $regex: regex } },
        { email: { $regex: regex } },
        { name: { $regex: regex } },
        { brandName: { $regex: regex } },
        { status: { $regex: regex } }
      ]
    }).populate('brand', 'name');

    res.status(200).json({
      merchants
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// fetch all merchants api
router.get('/', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const merchants = await Merchant.find()
      .populate('brand')
      .sort('-created')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Merchant.countDocuments();

    res.status(200).json({
      merchants,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      count
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// disable merchant account
router.put('/:id/active', auth, async (req, res) => {
  try {
    const merchantId = req.params.id;
    const update = req.body.merchant;
    const query = { _id: merchantId };

    const merchantDoc = await Merchant.findOneAndUpdate(query, update, {
      new: true
    });

    if (!update.isActive) {
      await deactivateBrand(merchantId);
      await nodemailer.sendEmail(
        merchantDoc.email,
        'merchant-deactivate-account'
      );
    }

    res.status(200).json({
      success: true
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// approve merchant
router.put('/approve/:id', auth, async (req, res) => {
  try {
    const merchantId = req.params.id;
    const query = { _id: merchantId };
    const update = {
      status: MERCHANT_STATUS.Approved,
      isActive: true
    };

    const merchantDoc = await Merchant.findOneAndUpdate(query, update, {
      new: true
    });

    await createMerchantUser(
      merchantDoc.email,
      merchantDoc.name,
      merchantId,
      req.headers.host
    );

    res.status(200).json({
      success: true
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// reject merchant
router.put('/reject/:id', auth, async (req, res) => {
  try {
    const merchantId = req.params.id;

    const query = { _id: merchantId };
    const update = {
      status: MERCHANT_STATUS.Rejected
    };

    await Merchant.findOneAndUpdate(query, update, {
      new: true
    });

    res.status(200).json({
      success: true
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

router.post('/signup/:token', async (req, res) => {
  try {
    const { email, firstName, lastName, password } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ error: 'You must enter an email address.' });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'You must enter your full name.' });
    }

    if (!password) {
      return res.status(400).json({ error: 'You must enter a password.' });
    }

    const userDoc = await User.findOne({
      email,
      resetPasswordToken: req.params.token
    });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const query = { _id: userDoc._id };
    const update = {
      email,
      firstName,
      lastName,
      password: hash,
      resetPasswordToken: undefined
    };

    await User.findOneAndUpdate(query, update, {
      new: true
    });

    const merchantDoc = await Merchant.findOne({
      email
    });

    await createMerchantBrand(merchantDoc);

    res.status(200).json({
      success: true
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

router.delete(
  '/delete/:id',
  auth,
  role.check(ROLES.Admin),
  async (req, res) => {
    try {
      const merchantId = req.params.id;
      await deactivateBrand(merchantId);
      const merchant = await Merchant.deleteOne({ _id: merchantId });

      res.status(200).json({
        success: true,
        message: `Merchant has been deleted successfully!`,
        merchant
      });
    } catch (error) {
      res.status(400).json({
        error: 'Your request could not be processed. Please try again.'
      });
    }
  }
);

const deactivateBrand = async merchantId => {
  const merchantDoc = await Merchant.findOne({ _id: merchantId }).populate(
    'brand',
    '_id'
  );
  if (!merchantDoc || !merchantDoc.brand) return;
  const brandId = merchantDoc.brand._id;
  const query = { _id: brandId };
  const update = {
    isActive: false
  };
  return await Brand.findOneAndUpdate(query, update, {
    new: true
  });
};

const createMerchantBrand = async ({ _id, brandName, business }) => {
  const newBrand = new Brand({
    name: brandName,
    description: business,
    merchant: _id,
    isActive: false
  });

  const brandDoc = await newBrand.save();

  const update = {
    brand: brandDoc._id
  };
  await Merchant.findOneAndUpdate({ _id }, update);
};

const createMerchantUser = async (email, name, merchant, host) => {
  const firstName = name;
  const lastName = '';

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    const query = { _id: existingUser._id };
    const update = {
      merchant,
      role: ROLES.Merchant
    };

    const merchantDoc = await Merchant.findOne({
      email
    });

    await createMerchantBrand(merchantDoc);

    await nodemailer.sendEmail(email, 'merchant-welcome', null, name);

    return await User.findOneAndUpdate(query, update, {
      new: true
    });
  } else {
    const buffer = await crypto.randomBytes(48);
    const resetToken = buffer.toString('hex');
    const resetPasswordToken = resetToken;

    const user = new User({
      email,
      firstName,
      lastName,
      resetPasswordToken,
      merchant,
      role: ROLES.Merchant
    });

    await nodemailer.sendEmail(email, 'merchant-signup', host, {
      resetToken,
      email
    });

    return await user.save();
  }
};

module.exports = router;
