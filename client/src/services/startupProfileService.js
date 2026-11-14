import api from "./api.js";
import { ContractResponseError, PROFILE_API_CONTRACT, createStartupProfilePayload, parseStartupProfileResponse } from "./beneficiaryContract.js";

export async function getStartupProfile({ signal, contract = PROFILE_API_CONTRACT } = {}) {
  try {
    const { data } = await api.get("/startup/profile", { signal });
    return parseStartupProfileResponse(data);
  } catch (error) {
    if (contract.missingProfileIs404 && error?.response?.status === 404) return null;
    throw error;
  }
}

async function saveProfile(method, values, options) {
  const { signal, contract = PROFILE_API_CONTRACT } = options;
  const { data } = await api[method]("/startup/profile", createStartupProfilePayload(values, contract), { signal });
  const profile = parseStartupProfileResponse(data);
  if (!profile) throw new ContractResponseError("The server did not return the saved startup profile. Please try again.");
  return profile;
}

export const createStartupProfile = (values, options = {}) => saveProfile("post", values, options);
export const updateStartupProfile = (values, options = {}) => saveProfile("patch", values, options);
