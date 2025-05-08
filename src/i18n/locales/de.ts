import type { LanguageMetadata, LanguageTranslation } from '../types';

export const de: LanguageTranslation = {
    translation: {
        menu: {
            file: {
                file: 'Datei',
                new: 'Neu',
                open: 'Öffnen',
                save: 'Speichern',
                import: 'Datenbank importieren',
                export_sql: 'SQL exportieren',
                export_as: 'Exportieren als',
                delete_diagram: 'Diagramm löschen',
                exit: 'Beenden',
            },
            edit: {
                edit: 'Bearbeiten',
                undo: 'Rückgängig',
                redo: 'Wiederholen',
                clear: 'Leeren',
            },
            view: {
                view: 'Ansicht',
                show_sidebar: 'Seitenleiste anzeigen',
                hide_sidebar: 'Seitenleiste ausblenden',
                hide_cardinality: 'Kardinalität ausblenden',
                show_cardinality: 'Kardinalität anzeigen',
                zoom_on_scroll: 'Zoom beim Scrollen',
                theme: 'Stil',
                show_dependencies: 'Abhängigkeiten anzeigen',
                hide_dependencies: 'Abhängigkeiten ausblenden',
                // TODO: Translate
                show_minimap: 'Show Mini Map',
                hide_minimap: 'Hide Mini Map',
            },
            // TODO: Translate
            backup: {
                backup: 'Backup',
                export_diagram: 'Export Diagram',
                restore_diagram: 'Restore Diagram',
            },
            help: {
                help: 'Hilfe',
                docs_website: 'Dokumentation',
                join_discord: 'Auf Discord beitreten',
            },
        },

        delete_diagram_alert: {
            title: 'Diagramm löschen',
            description:
                'Diese Aktion kann nicht rückgängig gemacht werden. Das Diagramm wird dauerhaft gelöscht.',
            cancel: 'Abbrechen',
            delete: 'Löschen',
        },

        clear_diagram_alert: {
            title: 'Diagramm leeren',
            description:
                'Diese Aktion kann nicht rückgängig gemacht werden. Alle Daten im Diagramm werden dauerhaft gelöscht.',
            cancel: 'Abbrechen',
            clear: 'Leeren',
        },

        reorder_diagram_alert: {
            title: 'Diagramm neu anordnen',
            description:
                'Diese Aktion wird alle Tabellen im Diagramm neu anordnen. Möchten Sie fortfahren?',
            reorder: 'Neu anordnen',
            cancel: 'Abbrechen',
        },

        multiple_schemas_alert: {
            title: 'Mehrere Schemas',
            description:
                '{{schemasCount}} Schemas in diesem Diagramm. Derzeit angezeigt: {{formattedSchemas}}.',
            dont_show_again: 'Nicht erneut anzeigen',
            change_schema: 'Schema ändern',
            none: 'Keine',
        },

        copy_to_clipboard_toast: {
            unsupported: {
                title: 'Kopieren fehlgeschlagen',
                description: 'Zwischenablage nicht unterstützt',
            },
            failed: {
                title: 'Kopieren fehlgeschlagen',
                description:
                    'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
            },
        },

        theme: {
            system: 'System',
            light: 'Hell',
            dark: 'Dunkel',
        },

        zoom: {
            on: 'Ein',
            off: 'Aus',
        },

        last_saved: 'Zuletzt gespeichert',
        saved: 'Gespeichert',
        loading_diagram: 'Diagramm wird geladen...',
        deselect_all: 'Alles abwählen',
        select_all: 'Alles auswählen',
        clear: 'Leeren',
        show_more: 'Mehr anzeigen',
        show_less: 'Weniger anzeigen',
        copy_to_clipboard: 'In die Zwischenablage kopieren',
        copied: 'Kopiert!',

        side_panel: {
            schema: 'Schema:',
            filter_by_schema: 'Nach Schema filtern',
            search_schema: 'Schema suchen...',
            no_schemas_found: 'Keine Schemas gefunden.',
            view_all_options: 'Alle Optionen anzeigen...',
            tables_section: {
                tables: 'Tabellen',
                add_table: 'Tabelle hinzufügen',
                filter: 'Filter',
                collapse: 'Alle einklappen',
                // TODO: Translate
                clear: 'Clear Filter',
                no_results: 'No tables found matching your filter.',
                // TODO: Translate
                show_list: 'Show Table List',
                show_dbml: 'Show DBML Editor',

                table: {
                    fields: 'Felder',
                    nullable: 'Nullable?',
                    primary_key: 'Primärschlüssel',
                    indexes: 'Indizes',
                    comments: 'Kommentare',
                    no_comments: 'Keine Kommentare',
                    add_field: 'Feld hinzufügen',
                    add_index: 'Index hinzufügen',
                    index_select_fields: 'Felder auswählen',
                    no_types_found: 'Keine Datentypen gefunden',
                    field_name: 'Name',
                    field_type: 'Datentyp',
                    field_actions: {
                        title: 'Feldattribute',
                        unique: 'Eindeutig',
                        comments: 'Kommentare',
                        no_comments: 'Keine Kommentare',
                        delete_field: 'Feld löschen',
                        // TODO: Translate
                        character_length: 'Max Length',
                    },
                    index_actions: {
                        title: 'Indexattribute',
                        name: 'Name',
                        unique: 'Eindeutig',
                        delete_index: 'Index löschen',
                    },
                    table_actions: {
                        title: 'Tabellenaktionen',
                        change_schema: 'Schema ändern',
                        add_field: 'Feld hinzufügen',
                        add_index: 'Index hinzufügen',
                        duplicate_table: 'Duplicate Table', // TODO: Translate
                        delete_table: 'Tabelle löschen',
                    },
                },
                empty_state: {
                    title: 'Keine Tabellen',
                    description: 'Erstellen Sie eine Tabelle, um zu beginnen',
                },
            },
            relationships_section: {
                relationships: 'Beziehungen',
                filter: 'Filter',
                add_relationship: 'Beziehung hinzufügen',
                collapse: 'Alle einklappen',
                relationship: {
                    primary: 'Primäre Tabelle',
                    foreign: 'Referenzierte Tabelle',
                    cardinality: 'Kardinalität',
                    delete_relationship: 'Beziehung löschen',
                    relationship_actions: {
                        title: 'Aktionen',
                        delete_relationship: 'Beziehung löschen',
                    },
                },
                empty_state: {
                    title: 'Keine Beziehungen',
                    description:
                        'Erstellen Sie eine Beziehung, um Tabellen zu verbinden',
                },
            },
            dependencies_section: {
                dependencies: 'Abhängigkeiten',
                filter: 'Filter',
                collapse: 'Alle einklappen',
                dependency: {
                    table: 'Tabelle',
                    dependent_table: 'Abhängige Ansicht',
                    delete_dependency: 'Löschen',
                    dependency_actions: {
                        title: 'Aktionen',
                        delete_dependency: 'Löschen',
                    },
                },
                empty_state: {
                    title: 'Keine Abhängigkeiten',
                    description: 'Erstellen Sie eine Ansicht, um zu beginnen',
                },
            },

            // TODO: Translate
            areas_section: {
                areas: 'Areas',
                add_area: 'Add Area',
                filter: 'Filter',
                clear: 'Clear Filter',
                no_results: 'No areas found matching your filter.',

                area: {
                    area_actions: {
                        title: 'Area Actions',
                        edit_name: 'Edit Name',
                        delete_area: 'Delete Area',
                    },
                },
                empty_state: {
                    title: 'No areas',
                    description: 'Create an area to get started',
                },
            },
        },

        toolbar: {
            zoom_in: 'Vergrößern',
            zoom_out: 'Verkleinern',
            save: 'Speichern',
            show_all: 'Alle anzeigen',
            undo: 'Rückgängig',
            redo: 'Wiederholen',
            reorder_diagram: 'Diagramm neu anordnen',
            highlight_overlapping_tables: 'Überlappende Tabellen hervorheben',
        },

        new_diagram_dialog: {
            database_selection: {
                title: 'Welche Datenbank verwenden Sie?',
                description:
                    'Jede Datenbank hat ihre eigenen Funktionen und Möglichkeiten.',
                check_examples_long: 'Beispiele ansehen',
                check_examples_short: 'Beispiele',
            },

            import_database: {
                title: 'Datenbank importieren',
                database_edition: 'Datenbank Edition:',
                step_1: 'Führen Sie dieses Skript in Ihrer Datenbank aus:',
                step_2: 'Fügen Sie das Skriptergebnis hier ein:',
                script_results_placeholder: 'Skriptergebnisse hier...',
                ssms_instructions: {
                    button_text: 'SSMS Anweisungen',
                    title: 'Anweisungen',
                    step_1: 'Gehen Sie zu Tools > Optionen > Abfrageergebnisse > SQL Server.',
                    step_2: 'Wenn Sie "Ergebnisse in Raster" verwenden, ändern Sie die maximale Zeichenanzahl für Nicht-XML-Daten (auf 9999999 setzen).',
                },
                instructions_link: 'Brauchen Sie Hilfe? So geht’s',
                check_script_result: 'Skriptergebnis überprüfen',
            },

            cancel: 'Abbrechen',
            back: 'Zurück',
            // TODO: Translate
            import_from_file: 'Import from File',
            empty_diagram: 'Leeres Diagramm',
            continue: 'Weiter',
            import: 'Importieren',
        },

        open_diagram_dialog: {
            title: 'Diagramm öffnen',
            description: 'Wählen Sie ein Diagramm aus der Liste unten aus.',
            table_columns: {
                name: 'Name',
                created_at: 'Erstellt am',
                last_modified: 'Zuletzt geändert',
                tables_count: 'Tabellen',
            },
            cancel: 'Abbrechen',
            open: 'Öffnen',
        },

        export_sql_dialog: {
            title: 'SQL exportieren',
            description:
                'Exportieren Sie das Schema Ihres Diagramms in ein {{databaseType}} Skript',
            close: 'Schließen',
            loading: {
                text: 'Die KI generiert SQL für {{databaseType}}...',
                description: 'Dies sollte bis zu 30 Sekunden dauern.',
            },
            error: {
                message:
                    'Fehler beim Generieren des SQL-Skripts. Bitte versuchen Sie es später erneut oder <0>kontaktieren Sie uns</0>.',
                description:
                    'Verwenden Sie Ihren OPENAI_TOKEN, siehe Anleitung <0>hier</0>.',
            },
        },

        create_relationship_dialog: {
            title: 'Beziehung erstellen',
            primary_table: 'Primäre Tabelle',
            primary_field: 'Primäres Feld',
            referenced_table: 'Referenzierte Tabelle',
            referenced_field: 'Referenziertes Feld',
            primary_table_placeholder: 'Tabelle auswählen',
            primary_field_placeholder: 'Feld auswählen',
            referenced_table_placeholder: 'Tabelle auswählen',
            referenced_field_placeholder: 'Feld auswählen',
            no_tables_found: 'Keine Tabellen gefunden',
            no_fields_found: 'Keine Felder gefunden',
            create: 'Erstellen',
            cancel: 'Abbrechen',
        },

        import_database_dialog: {
            title: 'In aktuelles Diagramm importieren',
            override_alert: {
                title: 'Datenbank importieren',
                content: {
                    alert: 'Das Importieren dieses Diagramms wird vorhandene Tabellen und Beziehungen beeinflussen.',
                    new_tables:
                        '<bold>{{newTablesNumber}}</bold> neue Tabellen werden hinzugefügt.',
                    new_relationships:
                        '<bold>{{newRelationshipsNumber}}</bold> neue Beziehungen werden erstellt.',
                    tables_override:
                        '<bold>{{tablesOverrideNumber}}</bold> Tabellen werden überschrieben.',
                    proceed: 'Möchten Sie fortfahren?',
                },
                import: 'Importieren',
                cancel: 'Abbrechen',
            },
        },

        export_image_dialog: {
            title: 'Bild exportieren',
            description: 'Wählen Sie den Skalierungsfaktor für den Export:',
            scale_1x: '1x Normal',
            scale_2x: '2x (Empfohlen)',
            scale_3x: '3x',
            scale_4x: '4x',
            cancel: 'Abbrechen',
            export: 'Exportieren',
            // TODO: Translate
            advanced_options: 'Advanced Options',
            pattern: 'Include background pattern',
            pattern_description: 'Add subtle grid pattern to background.',
            transparent: 'Transparent background',
            transparent_description: 'Remove background color from image.',
        },

        new_table_schema_dialog: {
            title: 'Schema auswählen',
            description:
                'Mehrere Schemas sind derzeit angezeigt. Wählen Sie eines für die neue Tabelle aus.',
            cancel: 'Abbrechen',
            confirm: 'Bestätigen',
        },

        update_table_schema_dialog: {
            title: 'Schema ändern',
            description: 'Schema der Tabelle "{{tableName}}" ändern',
            cancel: 'Abbrechen',
            confirm: 'Ändern',
        },

        star_us_dialog: {
            title: 'Hilf uns, uns zu verbessern!',
            description:
                'Gefällt Ihnen ChartDB? Lassen Sie es uns wissen und helfen Sie uns, ChartDB zu verbessern!',
            close: 'Nicht jetzt',
            confirm: 'Natürlich!',
        },
        // TODO: Translate
        export_diagram_dialog: {
            title: 'Export Diagram',
            description: 'Choose the format for export:',
            format_json: 'JSON',
            cancel: 'Cancel',
            export: 'Export',
            error: {
                title: 'Error exporting diagram',
                description:
                    'Something went wrong. Need help? support@chartdb.io',
            },
        },
        // TODO: Translate
        import_diagram_dialog: {
            title: 'Import Diagram',
            description: 'Paste the diagram JSON below:',
            cancel: 'Cancel',
            import: 'Import',
            error: {
                title: 'Error importing diagram',
                description:
                    'The diagram JSON is invalid. Please check the JSON and try again. Need help? support@chartdb.io',
            },
        },
        // TODO: Translate
        import_dbml_dialog: {
            example_title: 'Import Example DBML',
            title: 'Import DBML',
            description: 'Import a database schema from DBML format.',
            import: 'Import',
            cancel: 'Cancel',
            skip_and_empty: 'Skip & Empty',
            show_example: 'Show Example',
            error: {
                title: 'Error',
                description: 'Failed to parse DBML. Please check the syntax.',
            },
        },
        relationship_type: {
            one_to_one: 'Ein zu Eins (1:1)',
            one_to_many: 'Ein zu Viele (1:n)',
            many_to_one: 'Viele zu Eins (n:1)',
            many_to_many: 'Viele zu Viele (n:m)',
        },

        canvas_context_menu: {
            new_table: 'Neue Tabelle',
            new_relationship: 'Neue Beziehung',
            // TODO: Translate
            new_area: 'New Area',
        },

        table_node_context_menu: {
            edit_table: 'Tabelle bearbeiten',
            duplicate_table: 'Duplicate Table', // TODO: Translate
            delete_table: 'Tabelle löschen',
            add_relationship: 'Add Relationship', // TODO: Translate
        },

        // TODO: Add translations
        snap_to_grid_tooltip: 'Snap to Grid (Hold {{key}})',

        tool_tips: {
            double_click_to_edit: 'Doppelklicken zum Bearbeiten',
        },

        language_select: {
            change_language: 'Sprache',
        },
    },
};

export const deMetadata: LanguageMetadata = {
    name: 'German',
    nativeName: 'Deutsch',
    code: 'de',
};
