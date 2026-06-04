import api from "../utils/api";

export const createPaymentOrder = async (payload) => {
  const res = await api.post("/payments/create-order", payload);
  return res.data?.data;
};

export const verifyPayment = async (payload) => {
  const res = await api.post("/payments/verify", payload);
  return res.data?.data;
};
