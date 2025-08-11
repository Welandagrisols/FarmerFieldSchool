import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import { ProjectsDashboard } from "@/pages/projects-dashboard";
import { ProjectLayoutPage } from "@/pages/project-layout";
import { SurveyorPage } from "./pages/surveyor";
import { BaselineDataPage } from "./pages/baseline-data";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/projects" component={ProjectsDashboard} />
      <Route path="/projects/:id" component={ProjectLayoutPage} />
      <Route path="/projects/:id/survey" component={SurveyorPage} />
      <Route path="/projects/:id/baseline" component={BaselineDataPage} />
      <Route path="/survey" component={SurveyorPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
