const { CustomRequest } = require('./models');

// ─────────────────────────────────────────────
// 1. CREATE REQUEST — POST /api/custom-requests
// Customer sends a custom-made request to an artisan. status starts as 'pending'
// ─────────────────────────────────────────────
exports.createRequest = async (req, res) => {
  try {
    const { artisan, category, description, referenceImages, budgetRange } = req.body;
    if (!artisan || !description) {
      return res.status(400).json({ message: 'artisan and description are required' });
    }

    const request = await CustomRequest.create({
      customer: req.user._id,
      artisan,
      category,
      description,
      referenceImages,
      budgetRange,
      status: 'pending',
    });

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create request', error: err.message });
  }
};

// ─────────────────────────────────────────────
// 2. LIST — GET /api/custom-requests  (mine, either as customer or artisan)
// ─────────────────────────────────────────────
exports.getMyRequests = async (req, res) => {
  try {
    const requests = await CustomRequest.find({
      $or: [{ customer: req.user._id }, { artisan: req.user._id }],
    })
      .populate('customer', 'name')
      .populate('artisan', 'name')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch requests', error: err.message });
  }
};

// ─────────────────────────────────────────────
// 3. QUOTE — PUT /api/custom-requests/:id/quote   (artisan only)
// pending → quoted
// ─────────────────────────────────────────────
exports.quoteRequest = async (req, res) => {
  try {
    const request = await CustomRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.artisan.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your request to quote' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Cannot quote a request in '${request.status}' status` });
    }

    const { price, estimatedDays, message } = req.body;
    if (!price) return res.status(400).json({ message: 'price is required' });

    request.quotation = { price, estimatedDays, message, quotedAt: new Date() };
    request.status = 'quoted';
    await request.save();

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit quotation', error: err.message });
  }
};

// ─────────────────────────────────────────────
// 4. RESPOND — PUT /api/custom-requests/:id/respond   (customer only)
// quoted → accepted | rejected
// ─────────────────────────────────────────────
exports.respondToQuote = async (req, res) => {
  try {
    const request = await CustomRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your request to respond to' });
    }
    if (request.status !== 'quoted') {
      return res.status(400).json({ message: `Cannot respond — request is '${request.status}', not 'quoted'` });
    }

    const { accept } = req.body; // boolean
    if (accept === undefined) return res.status(400).json({ message: 'accept (true/false) is required' });

    request.status = accept ? 'accepted' : 'rejected';
    await request.save();

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: 'Failed to respond to quotation', error: err.message });
  }
};

// ─────────────────────────────────────────────
// 5. CONVERT TO ORDER — POST /api/custom-requests/:id/convert
// accepted → converted. Hands off to Amali's Order module + Janapriya's
// deposit payment step. Only the request owner (customer) can trigger this,
// typically right after paying the deposit.
// ─────────────────────────────────────────────
exports.convertToOrder = async (req, res) => {
  try {
    const request = await CustomRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your request to convert' });
    }
    if (request.status !== 'accepted') {
      return res.status(400).json({ message: `Cannot convert — request must be 'accepted', currently '${request.status}'` });
    }

    // NOTE: actual Order creation happens in Amali's Order module.
    // This just marks the request as converted and stores the resulting orderId.
    // Example (once Order model/controller exists):
    //
    // const order = await Order.create({
    //   customer: request.customer,
    //   artisan: request.artisan,
    //   type: 'custom',
    //   price: request.quotation.price,
    //   customRequest: request._id,
    // });
    // request.convertedOrder = order._id;

    const { orderId } = req.body; // temporary, until Order module is wired in
    request.status = 'converted';
    request.convertedOrder = orderId || null;
    await request.save();

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: 'Failed to convert request to order', error: err.message });
  }
};
