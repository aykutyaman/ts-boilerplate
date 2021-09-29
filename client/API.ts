import { api } from "../shared/api";
import { getClient } from "./fetch";

export const apiClient = getClient(api);


