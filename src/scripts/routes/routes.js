import HomePage from "../pages/home/home-page";
import AboutPage from "../pages/about/about-page";
import LoginPage from "../pages/auth/login-page";
import RegisterPage from "../pages/auth/register-page";
import AddPage from "../pages/add/add-page";
import SavedPage from "../pages/saved/saved-page";
import NotFoundPage from "../pages/not-found/not-found-page";

const routes = {
  "/": new HomePage(),
  "/login": new LoginPage(),
  "/register": new RegisterPage(),
  "/add": new AddPage(),
  "/saved": new SavedPage(),
  "/about": new AboutPage(),
  "/not-found": new NotFoundPage(),
};
export default routes;
