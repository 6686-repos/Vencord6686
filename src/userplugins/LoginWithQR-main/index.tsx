/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { getIntlMessage } from "@utils/discord";
import definePlugin, { OptionType } from "@utils/types";
import { Button, Forms, Menu } from "@webpack/common";
import { ReactElement } from "react";

import { preload, unload } from "./images";
import { cl } from "./ui";
import openQrModal from "./ui/modals/QrModal";

export default definePlugin({
    name: "LoginWithQR",
    description:
        "Allows you to login to another device by scanning a login QR code, just like on mobile!",
    authors: [
        {
            name: "Nexpid",
            id: 853550207039832084n,
        },
    ],

    settings: definePluginSettings({
        scanQr: {
            type: OptionType.COMPONENT,
            description: "Scan a QR code",
            component() {
                if (!Vencord.Plugins.plugins.LoginWithQR.started)
                    return (
                        <Forms.FormText>
                            Enable the plugin and restart your client to scan a login QR code
                        </Forms.FormText>
                    );

                return (
                    <Button size={Button.Sizes.SMALL} onClick={openQrModal}>
                        {getIntlMessage("USER_SETTINGS_SCAN_QR_CODE")}
                    </Button>
                );
            },
        },
    }),

    patches: [
        // Prevent paste event from firing when the QRModal is open
        {
            find: ".clipboardData&&(",
            replacement: {
                // Find the handleGlobalPaste & handlePaste functions and prevent
                // them from firing when the modal is open. Does this have any
                // side effects? Maybe
                match: /handle(Global)?Paste:(\i)(}|,)/g,
                replace: "handle$1Paste:(...args)=>!$self.qrModalOpen&&$2(...args)$3",
            },
        },
        // Insert a Scan QR Code button in the My Account tab
        {
            find: "UserSettingsAccountProfileCard",
            replacement: {
                // Find the Edit User Profile button and insert our custom button.
                // A bit jank, but whatever
                match: /,(\(.{1,90}2p2aY2"]\)\}\))/,
                replace: ",$self.insertScanQrButton($1)"
            }
        },
        // Insert a Scan QR Code MenuItem in the Swith Accounts popout
        {
            find: 'id:"manage-accounts"',
            replacement: {
                match: /(id:"manage-accounts",.*?)}\)\)(,\i)/,
                replace: "$1}),$self.ScanQrMenuItem)$2"
            }
        },

        // Insert a Scan QR Code button in the Settings sheet
        {
            find: "useGenerateUserSettingsSections",
            replacement: {
                match: /(\.FRIEND_REQUESTS)/,
                replace: "$1,\"SCAN_QR_CODE\""
            }
        },
        // Insert a Scan QR Code button in the Settings sheet (part 2)
        {
            find: ".PRIVACY_ENCRYPTION_VERIFIED_DEVICES_V2]",
            replacement: {
                match: /(\.CLIPS]:{.*?},)/,
                replace: "$1\"SCAN_QR_CODE\":$self.ScanQrSettingsSheet,"
            }
        }
    ],

    qrModalOpen: false,

    insertScanQrButton: (button: ReactElement) => (
        <div className={cl("settings-btns")}>
            <Button size={Button.Sizes.SMALL} onClick={openQrModal}>
                {getIntlMessage("USER_SETTINGS_SCAN_QR_CODE")}
            </Button>
            {button}
        </div>
    ),
    get ScanQrMenuItem() {
        return <Menu.MenuItem id="scan-qr" label={getIntlMessage("USER_SETTINGS_SCAN_QR_CODE")} action={openQrModal} />;
    },
    get ScanQrSettingsSheet() {
        return {
            section: getIntlMessage("USER_SETTINGS_SCAN_QR_CODE"),
            onClick: openQrModal,
            searchableTitles: [getIntlMessage("USER_SETTINGS_SCAN_QR_CODE")],
            label: getIntlMessage("USER_SETTINGS_SCAN_QR_CODE"),
            ariaLabel: getIntlMessage("USER_SETTINGS_SCAN_QR_CODE")
        };
    },

    start() {
        // Preload images
        preload();
    },

    stop() {
        unload?.();
    },
});
