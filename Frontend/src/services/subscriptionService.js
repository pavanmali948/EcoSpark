import api from "../utils/api";

export const getSubscriptionPlans = async () => {
  const res = await api.get("/subscription/plans");
  return res.data?.data || [];
};

export const createSubscriptionPlan = async (payload) => {
  const res = await api.post("/subscription/plans", payload);
  return res.data?.data;
};

export const getCurrentSubscription = async () => {
  const res = await api.get("/subscription/current");
  return res.data?.data;
};

export const createSubscriptionOrder = async (payload) => {
  const res = await api.post("/subscription/create-order", payload);
  return res.data?.data;
};

export const verifySubscription = async (payload) => {
  const res = await api.post("/subscription/verify", payload);
  return res.data?.data;
};
