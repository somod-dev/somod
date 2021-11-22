import * as React from "react";
import { format } from "date-fns";
import { useDateTimeContext } from "../context";
var View = function (_a) {
    var value = _a.value, type = _a.type, variant = _a.variant;
    var datetimeconfig = useDateTimeContext();
    var content = "";
    switch (type) {
        case "string":
            content = value + "";
            break;
        case "number":
            content = value + "";
            break;
        case "boolean":
            content = value ? "True" : "False";
            break;
        case "datetime":
            {
                // @ts-expect-error typecasting
                var _value = value;
                switch (variant) {
                    case "datetime":
                        content = format(_value, datetimeconfig.dateTimeFormat);
                        break;
                    case "date":
                        content = format(_value, datetimeconfig.dateFormat);
                        break;
                    case "time":
                        content = format(_value, datetimeconfig.timeFormat);
                        break;
                    default:
                        content = value + "";
                }
            }
            break;
        default:
            content = value + "";
    }
    return React.createElement("span", null, content);
};
export default View;
