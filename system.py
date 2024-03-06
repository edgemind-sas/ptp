import kb
import muscadet
import pandas as pd
import pkg_resources
installed_pkg = {pkg.key for pkg in pkg_resources.working_set}
if 'ipdb' in installed_pkg:
    import ipdb  # noqa: 401


class PTPSystem(muscadet.System):
    def __init__(self, name, specs=None, logger=None):
        super().__init__(name)

        self.logger = logger
        
        if isinstance(specs, str):
            specs_dfd = pd.read_excel(specs, sheet_name=None)
            for sheetname, df in specs_dfd.items():
                specs_dfd[sheetname] = df.where(pd.notnull(df), None)
            specs = {name: sdf.to_dict("records")
                     for name, sdf in specs_dfd.items()
                     if name in ["tasks"]}
            
        self.specs = specs

        if self.specs:
            self.build_system()

    def build_system(self):

        self.create_components()
        self.create_connections()
        self.create_indicators()

    def create_components(self):

        self.add_component(cls="Start",
                           name="Start")
        self.add_component(cls="End",
                           name="End")

        for task_specs in self.specs["tasks"]:
            self.add_component(cls="Task",
                               name=str(task_specs.get("task_id")),
                               duration_min=task_specs.get("duration_min", 0),
                               duration_max=task_specs.get("duration_max", 0),
                               )

    def create_connections(self):

        dep_set = []
        for task_specs in self.specs["tasks"]:
            task_cur = task_specs.get("task_id")
            if dep := task_specs.get("depends_on"):
                if not dep:
                    continue
                tasks_dep_list = dep.split(",")
                [self.auto_connect(task_dep, task_cur)
                 for task_dep in tasks_dep_list]
                dep_set = list(set(dep_set) | set(tasks_dep_list))
            else:
                self.auto_connect("Start", task_cur)

        for task_specs in self.specs["tasks"]:
            task_cur = task_specs.get("task_id")
            if not (task_cur in dep_set):
                self.auto_connect(task_cur, "End")

    def create_indicators(self):

        self.add_indicator_var(
            component=".*",
            var=".*fed_out$",
            stats=["mean", "stddev"],
        )

        # self.add_component(cls="Block",
        #                    name="C1")

        # self.add_component(cls="Block",
        #                    name="C2")

        # self.add_component(cls="Block",
        #                    name="C3")

        # self.add_component(cls="Block",
        #                    name="C4")

        # self.auto_connect("S", "C[12]")
        # self.auto_connect("C[12]", "C3")

        # self.add_logic_or("LO__C", {"C[12]": ".*"},
        #                   )

        # self.add_logic_or("LI__C", {"C[12]": ".*"},
        #                   on_available=True,
        #                   )

        # param_s = dict(
        #     name="frun",
        #     failure_rate=1/5,
        #     repair_rate=1/3,
        #     failure_effects=[(".*_available_out", False)],
        # )

        # param_c1 = dict(
        #     name="frun",
        #     failure_time=7,
        #     repair_time=2,
        #     failure_effects=[(".*_available_out", False)],
        # )

        # param_c2 = dict(
        #     name="frun",
        #     failure_time=5,
        #     repair_time=3,
        #     failure_effects=[(".*_available_out", False)],
        # )

        # self.comp["S"].add_exp_failure_mode(**param_s)
        # self.comp["C1"].add_delay_failure_mode(**param_c1)
        # self.comp["C2"].add_delay_failure_mode(**param_c2)
