const { Node, Schema, fields } = require("@mayahq/module-sdk");
const axios = require("../../util/axios"); // Define your axios instance in the utils folder

class Session extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            masterKey:
                "eda344e1ab8b9e122aab3350eec33e95802c7fe68aac8ad85c5c64d97e45ef1a",
        });
    }

    static schema = new Schema({
        name: "session",
        label: "Session",
        category: "Maya",
        isConfig: false,
        fields: {
            action: new fields.SelectFieldSet({
                optionNameMap: {
                    new_session: "New Session",
                    get_session: "Get Session",
                    delete_session: "Delete Session",
                    list_sessions: "List Sessions",
                    add_step: "Add Step",
                    delete_step: "Delete Step",
                    clear_session: "Clear Session",
                    session_undo: "Session Undo",
                    session_deploy: "Session Deploy",
                },
                fieldSets: {
                    new_session: {},
                    get_session: {
                        session_id_1: new fields.Typed({
                            type: "str",
                            allowedTypes: ["msg", "flow", "global", "str"],
                            defaultVal: "abc",
                            displayName: "Session Id",
                        }),
                    },
                    delete_session: {
                        session_id_2: new fields.Typed({
                            type: "str",
                            allowedTypes: ["msg", "flow", "global", "str"],
                            defaultVal: "abc",
                            displayName: "Session Id",
                        }),
                    },
                    list_sessions: {},
                    add_step: {
                        session_id_4: new fields.Typed({
                            type: "str",
                            allowedTypes: ["msg", "flow", "global", "str"],
                            defaultVal: "abc",
                            displayName: "Session Id",
                        }),

                        step_prompt_4: new fields.Typed({
                            type: "str",
                            allowedTypes: ["msg", "flow", "global", "str"],
                            defaultVal: "abc",
                            displayName: "Step Prompt",
                        }),

                        position_4: new fields.Typed({
                            type: "num",
                            allowedTypes: ["msg", "flow", "global", "num"],
                            defaultVal: "abc",
                            displayName: "Position",
                        }),
                    },
                    delete_step: {
                        session_id_5: new fields.Typed({
                            type: "str",
                            allowedTypes: ["msg", "flow", "global", "str"],
                            defaultVal: "abc",
                            displayName: "Session Id",
                        }),

                        step_id_5: new fields.Typed({
                            type: "str",
                            allowedTypes: ["msg", "flow", "global", "str"],
                            defaultVal: "abc",
                            displayName: "Step Id",
                        }),
                    },
                    clear_session: {
                        session_id_6: new fields.Typed({
                            type: "str",
                            allowedTypes: ["msg", "flow", "global", "str"],
                            defaultVal: "abc",
                            displayName: "Session Id",
                        }),

                        instruction_6: new fields.Typed({
                            type: "str",
                            allowedTypes: ["msg", "flow", "global", "str"],
                            defaultVal: "abc",
                            displayName: "Instruction",
                        }),

                        from_scratch_6: new fields.Typed({
                            type: "str",
                            allowedTypes: ["msg", "flow", "global"],
                            defaultVal: "abc",
                            displayName: "From Scratch",
                        }),
                    },
                    session_undo: {},
                    session_undo: {},
                    session_deploy: {},
                },
            }),
        },
        color: "#37B954",
    });

    async onMessage(msg, vals) {
        this.setStatus("PROGRESS", "Making request...");
        let requestConfig = {};

        if ((vals.action.selected = "new_session")) {
            requestConfig = {
                url: `/api/v1/session/new`,
                method: "post",
                data: {},
            };
        }

        if ((vals.action.selected = "get_session")) {
            requestConfig = {
                url: `/api/v1/session/${vals.action.childValues.session_id_1}`,
                method: "get",
                data: {},
            };
        }

        if ((vals.action.selected = "delete_session")) {
            requestConfig = {
                url: `/api/v1/session/${vals.action.childValues.session_id_2}`,
                method: "delete",
                data: {},
            };
        }

        if ((vals.action.selected = "list_sessions")) {
            requestConfig = {
                url: `/api/v1/sessions`,
                method: "get",
                data: {},
            };
        }

        if ((vals.action.selected = "add_step")) {
            requestConfig = {
                url: `/api/v1/session/step/add`,
                method: "post",
                data: {
                    session_id: vals.action.childValues.session_id_4,
                    step_prompt: vals.action.childValues.step_prompt_4,
                    position: vals.action.childValues.position_4,
                },
            };
        }

        if ((vals.action.selected = "delete_step")) {
            requestConfig = {
                url: `/api/v1/session/step/delete`,
                method: "delete",
                data: {
                    session_id: vals.action.childValues.session_id_5,
                    step_id: vals.action.childValues.step_id_5,
                },
            };
        }

        if ((vals.action.selected = "clear_session")) {
            requestConfig = {
                url: `/api/v1/session/clear`,
                method: "post",
                data: {
                    session_id: vals.action.childValues.session_id_6,
                    instruction: vals.action.childValues.instruction_6,
                    from_scratch: vals.action.childValues.from_scratch_6,
                },
            };
        }

        if ((vals.action.selected = "session_undo")) {
            requestConfig = {
                url: `/api/v1/session/undo`,
                method: "post",
                data: {},
            };
        }

        if ((vals.action.selected = "session_undo")) {
            requestConfig = {
                url: `/api/v1/session/redo`,
                method: "post",
                data: {},
            };
        }

        if ((vals.action.selected = "session_deploy")) {
            requestConfig = {
                url: `/api/v1/session/deploy`,
                method: "post",
                data: {},
            };
        }

        try {
            const response = await axios(requestConfig);
            msg.payload = response.data;
            this.setStatus("SUCCESS", "Done");
        } catch (e) {
            console.log("There was an error making the request:", e);
            this.setStatus(
                "ERROR",
                "There was an error making the request:" + e.toString()
            );
        }
        return msg;
    }
}

module.exports = Session;
