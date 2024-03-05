var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const ids = [
    "example.foundation.software.flatcar:bump",
    "example.integration.application.bus:watch",
    "example.platform:build",
    "example.platform:bump",
    "example.ui:cowsay"
];
const statuses = [
    "not started",
    "running",
    "finished"
];
const generateRandomArray = () => {
    return ids.map((id) => ({
        id,
        status: statuses[Math.floor(Math.random() * statuses.length)]
    }));
};
export default function () {
    return __awaiter(this, void 0, void 0, function* () {
        return {
            send: [{
                    payload: generateRandomArray()
                }]
        };
    });
}
