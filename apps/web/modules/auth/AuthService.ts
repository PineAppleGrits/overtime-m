import { client } from "../common/client/baseClient";
import { Service } from "../common/services/Service";

class AuthService extends Service {
  async getProfile() {
    const { data } = await this.client.get("/auth/profile");
    return data;
  }
}

const authService = new AuthService(client);
export default authService;