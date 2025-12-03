declare namespace NodeJS {
  interface ProcessEnv {
    FRONTEND_ENDPOINT?: string;
    BACKEND_ENDPOINT?: string;
  }

  var __ENV: {
    FRONTEND_ENDPOINT?: string;
    BACKEND_ENDPOINT?: string;
  };
}
