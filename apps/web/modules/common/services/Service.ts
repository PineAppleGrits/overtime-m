import { AxiosInstance } from "axios";

export class Service {
    protected client: AxiosInstance;

    constructor(client: AxiosInstance) {
        this.client = client;
    }
}


