const { Node, Schema, fields } = require("@mayahq/module-sdk");
const axios = require("../../utils/axios");

class AddStep extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            masterKey:
                "eda344e1ab8b9e122aab3350eec33e95802c7fe68aac8ad85c5c64d97e45ef1a",
        });
    }

    static schema = new Schema({
        name: "add-step",
        label: "Add Step",
        category: "Maya :: session",
        isConfig: false,
        fields: {
            session_id: new fields.Typed({
                type: "str",
                allowedTypes: ["msg", "flow", "global", "str"],
                defaultVal: "abc",
                displayName: "Session Id",
            }),

            step_prompt: new fields.Typed({
                type: "str",
                allowedTypes: ["msg", "flow", "global", "str"],
                defaultVal: "abc",
                displayName: "Step Prompt",
            }),

            position: new fields.Typed({
                type: "num",
                allowedTypes: ["msg", "flow", "global", "num"],
                defaultVal: "abc",
                displayName: "Position",
            }),
        },
        color: "#37B954",
    });

    async onMessage(msg, vals) {
        this.setStatus("PROGRESS", "Processing...");

        const request = {
            url: "/api/v1/session/step/add",
            method: "post",
            data: {
                session_id: vals.session_id,
                step_prompt: vals.step_prompt,
                position: vals.position,
            },
        };

        try {
            const response = await axios(request);
            msg.payload = response.data;
            this.setStatus("SUCCESS", "Done");
        } catch (e) {
            this.setStatus("ERROR", "Error:" + e.toString());
            msg.__isError = true;
            msg.__error = e;
        }

        return msg;
    }
}

module.exports = AddStep;
