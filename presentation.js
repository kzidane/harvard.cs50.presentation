define(function(require, exports, module) {
    main.consumes = [
        "ace.status", "menus", "Plugin", "preferences",
        "settings", "tree", "ui"
    ];
    main.provides = ["harvard.cs50.presentation"];
    return main;

    function main(options, imports, register) {
        var menus = imports.menus;
        var Plugin = imports.Plugin;
        var prefs = imports.preferences;
        var settings = imports.settings;
        var status = imports["ace.status"];
        var ui = imports.ui;

        var plugin = new Plugin("CS50", main.consumes);

        var presenting = false;
        var menuItem = null;

        /**
         * swaps values of settings at path1 and path2. setting values are
         * assumed to be numeric.
         *
         * @param {string} path1 path of first setting
         * @param {string} path2 path of second setting
         */
        function swapSettings(path1, path2) {
            var val = settings.getNumber(path2);
            settings.set(path2, settings.getNumber(path1));
            settings.set(path1, val);
        }

        /**
         * Toggles visibility of components that are shown or hidden as
         * presentation is toggled.
         *
         * @param {boolean} show whether components are shown or hidden
         */
        function showComponents(show) {
            if (typeof show !== "boolean")
                return;

            if (show) {
                // show status bar
                status.show();

                // show avatar
                ui.setStyleRule(".btnName", "display", "initial");
            }
            else {
                // hide status bar
                status.hide();

                // hide avatar
                ui.setStyleRule(".btnName", "display", "none !important");
            }
        }

        /**
         * toggles presentation mode on or off.
         *
         * @param {boolean} [override] ideally used when loading/unloading to
         * force toggle presentation mode on/off without saving settings.
         */
        function togglePresentationMode(override) {
            if (typeof override === "boolean") {

                // handle unloading when presentation is on
                if (!override && presenting) {

                    // toggle off presentation mode for ace and terminal
                    updateEditors();

                    // show components that were hidden on presenting
                    showComponents(true);
                }

                if (override === presenting)
                    return;

                presenting = override;
            }
            else {
                presenting = !presenting;
                settings.set("user/cs50/presentation/@presenting", presenting);
                updateEditors();
            }

            // hide components that should be hidden on presenting
            showComponents(!presenting);

            // sync menu item
            menuItem.checked = presenting;
        }

        /**
         * Toggles presentation on or off for ace and terminal.
         */
        function updateEditors() {
            swapSettings(
                "user/cs50/presentation/@editorFontSize",
                "user/ace/@fontSize"
            );
            swapSettings(
                "user/cs50/presentation/@terminalFontSize",
                "user/terminal/@fontsize"
            );
        }

        plugin.on("load", function() {

            // add menu item to View menu
            menuItem = new ui.item({
                type: "check",
                caption: "Presentation Mode",
                onclick: togglePresentationMode
            });
            menus.addItemByPath(
                "View/PresentationDiv", new ui.divider(), 1, plugin
            );
            menus.addItemByPath("View/Presentation Mode", menuItem, 2, plugin);

            // default settings
            settings.on("read", function() {
                settings.setDefaults("user/cs50/presentation", [
                    ["presenting", false],
                    ["editorFontSize", 18],
                    ["terminalFontSize", 18]
                ]);
            });

            settings.on("write", function() {
                if (settings.getBool("user/cs50/presentation/@presenting") !== presenting)
                    menus.click("View/Presentation Mode");
            });

            // add toggle button to preferences
            prefs.add({
               "CS50" : {
                    position: 25,
                    "Presentation Mode" : {
                        position: 10,
                        "Presentation Mode" : {
                            type: "checkbox",
                            setting: "user/cs50/presentation/@presenting",
                            position: 200
                        }
                    }
                }
            }, plugin);

            togglePresentationMode(
                settings.getBool("user/cs50/presentation/@presenting")
            );
        });

        plugin.on("unload", function() {
            togglePresentationMode(false);
            menuItem = null;
            presenting = false;
        });

        plugin.freezePublicAPI({

            /**
             * @property presenting whether presentation is on
             * @readonly
             */
            get presenting(){ return presenting; }
        });
        register(null, {
            "harvard.cs50.presentation": plugin
        });
    }
});
