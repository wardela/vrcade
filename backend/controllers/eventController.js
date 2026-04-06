const eventService = require("../services/eventService");

const getApiMessage = (error, fallbackMessage) => error?.message || fallbackMessage;

const ensureEventSystemItem = async (req, res) => {
  try {
    const result = await eventService.ensureEventInvoiceItem(req.db);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error ensuring event system item:", error);
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: getApiMessage(error, "Failed to ensure event system item") });
  }
};

const listEvents = async (req, res) => {
  try {
    const events = await eventService.listEvents(req.db);
    res.status(200).json(events);
  } catch (error) {
    console.error("Error listing events:", error);
    res.status(500).json({ message: getApiMessage(error, "Failed to load events") });
  }
};

const createEvent = async (req, res) => {
  try {
    const created = await eventService.createEvent(req.db, req.body, {
      userId: req.user?.user_id || null,
    });
    res.status(201).json(created);
  } catch (error) {
    console.error("Error creating event:", error);
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: getApiMessage(error, "Failed to create event") });
  }
};

const getEventDetails = async (req, res) => {
  try {
    const event = await eventService.getEventDetails(req.db, req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error("Error fetching event details:", error);
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: getApiMessage(error, "Failed to load event details") });
  }
};

const getEventPayments = async (req, res) => {
  try {
    const payments = await eventService.getEventPayments(req.db, req.params.id);
    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching event payments:", error);
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: getApiMessage(error, "Failed to load event payments") });
  }
};

const addEventPayment = async (req, res) => {
  try {
    const result = await eventService.addEventPayment(req.db, req.params.id, req.body, {
      userId: req.user?.user_id || null,
    });
    res.status(201).json(result);
  } catch (error) {
    console.error("Error adding event payment:", error);
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: getApiMessage(error, "Failed to add event payment") });
  }
};

module.exports = {
  ensureEventSystemItem,
  listEvents,
  createEvent,
  getEventDetails,
  getEventPayments,
  addEventPayment,
};
