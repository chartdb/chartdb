import type { LanguageMetadata, LanguageTranslation } from '../types';

export const ml: LanguageTranslation = {
    translation: {
        menu: {
            file: {
                file: 'ഫയൽ',
                new: 'പുതിയത്',
                open: 'തുറക്കുക',
                save: 'സംരക്ഷിക്കുക',
                import_database: 'ഡാറ്റാബേസ് ഇറക്കുമതി ചെയ്യുക',
                export_sql: 'SQL കയറ്റുമതി ചെയ്യുക',
                export_as: 'ആയി കയറ്റുമതി',
                delete_diagram: 'ഡയഗ്രം ഇല്ലാതാക്കുക',
                exit: 'പുറത്ത്',
            },
            edit: {
                edit: 'തിരുത്തുക',
                undo: 'പഴയപടിയാക്കുക',
                redo: 'വീണ്ടും ചെയ്യുക',
                clear: 'വ്യക്തമായ',
            },
            view: {
                view: 'കാഴ്ച',
                show_sidebar: 'സൈഡ്‌ബാർ കാണിക്കുക',
                hide_sidebar: 'സൈഡ്‌ബാർ മറയ്ക്കുക',
                hide_cardinality: 'കാർഡിനാലിറ്റി മറയ്ക്കുക',
                show_cardinality: 'കാർഡിനാലിറ്റി കാണിക്കുക',
                zoom_on_scroll: 'സ്ക്രോളിൽ സൂം ചെയ്യുക',
                theme: 'തീം',
                show_dependencies: 'ആശ്രിതത്വം കാണിക്കുക',
                hide_dependencies: 'ഡിപൻഡൻസികൾ മറയ്ക്കുക',
            },
            share: {
                  share: 'പങ്കിടുക',
                  export_diagram: 'കയറ്റുമതി ഡയഗ്രം',
                  import_diagram: 'ഇറക്കുമതി ഡയഗ്രം',
              },
              
            help: {
                help: 'സഹായം',
                visit_website: 'വെബ്സൈറ്റ് സന്ദർശിക്കുക',
                join_discord: 'ഭിന്നതയിൽ ചേരുക',
                schedule_a_call: 'ഒരു കോൾ ഷെഡ്യൂൾ ചെയ്യുക!',
            },
        },

        delete_diagram_alert: {
            title: 'ഡയഗ്രം ഇല്ലാതാക്കുക',
            description:
                'ഈ പ്രവർത്തനം പഴയപടിയാക്കാനാകില്ല. ഇത് ഡയഗ്രം ശാശ്വതമായി ഇല്ലാതാക്കും.',
            cancel: 'റദ്ദാക്കുക',
            delete: 'ഇല്ലാതാക്കുക',
        },

        clear_diagram_alert: {
            title: 'ഡയഗ്രം വൃത്തിയാക്കുക',
            description:
                'ഈ പ്രവർത്തനം പഴയപടിയാക്കാനാകില്ല. ഇത് ഡയഗ്രാമിലെ എല്ലാ ഡാറ്റയും ശാശ്വതമായി ഇല്ലാതാക്കും.',
            cancel: 'റദ്ദാക്കുക',
            clear: 'വ്യക്തമായ',
        },

        reorder_diagram_alert: {
            title: 'ഡയഗ്രം പുനഃക്രമീകരിക്കുക',
            description:
                'ഈ പ്രവർത്തനം ഡയഗ്രാമിലെ എല്ലാ പട്ടികകളും പുനഃക്രമീകരിക്കും. നിങ്ങൾക്ക് തുടരണോ?',
            reorder: 'പുനഃക്രമീകരിക്കുക',
            cancel: 'റദ്ദാക്കുക',
        },

        multiple_schemas_alert: {
            title: 'ഒന്നിലധികം സ്കീമ',
            description:
                '{{schemasCount}} സ്കീമകൾ ഈ ഡയഗ്രാമിലുണ്ട്. നിലവിൽ കാണിക്കുന്നത്: {{formattedSchemas}}.',
            dont_show_again: 'വീണ്ടും കാണിക്കരുത്',
            change_schema: 'പ്രതികാരം',
            none: 'ഒന്നുമില്ല',
        },

        copy_to_clipboard_toast: {
            unsupported: {
                title: 'പകർത്താനായില്ല',
                description: 'ക്ലിപ്പ്ബോർഡ് പിന്തുണയ്ക്കുന്നില്ല',
            },
            failed: {
                title: 'പകർത്താനായില്ല',
                description: 'എന്തോ കുഴപ്പം സംഭവിച്ചു. ദയവായി വീണ്ടും ശ്രമിക്കുക.',
            },
        },

        theme: {
            system: 'സിസ്റ്റം',
            light: 'വെളിച്ചം',
            dark: 'ഇരുണ്ട',
        },

        zoom: {
            on: 'ഓൺ',
            off: 'ഓഫ്',
        },

        last_saved: 'അവസാനമായി സംരക്ഷിച്ചു',
        saved: 'രക്ഷിച്ചു',
        diagrams: 'ഡയഗ്രം',
        loading_diagram: 'ഡയഗ്രം ലോഡ് ചെയ്യുന്നു...',
        deselect_all: 'എല്ലാം തിരഞ്ഞെടുത്തത് മാറ്റുക',
        select_all: 'सर्व निवडा',
        clear: 'വ്യക്തമായ',
        show_more: 'अधिक दाखवा',
        show_less: 'कमी दाखवा',
        // TODO: Add translations
        copy_to_clipboard: 'Copy to Clipboard',
        // TODO: Add translations
        copied: 'Copied!',

        side_panel: {
            schema: 'സ്കീമ:',
            filter_by_schema: 'സ്കീമയിലൂടെ ഫിൽറ്റർ ചെയ്യുക',
            search_schema: 'സ്കീമ തിരയുക...',
            no_schemas_found: 'ഒരുതും സ്കീമുകൾ കണ്ടില്ല.',
            view_all_options: 'എല്ലാ ഓപ്ഷനുകളും കാണുക...',
            tables_section: {
                tables: 'ടേബിളുകൾ',
                add_table: 'ടേബിൾ ചേർക്കുക',
                filter: 'ഫിൽറ്റർ',
                collapse: 'എല്ലാം പ്രതിസന്ധി ചെയ്യുക',            

                table: {
                  fields: 'ഫീൽഡുകൾ',
                  nullable: 'നാൽ ചെയ്യാമോ?',
                  primary_key: 'പ്രാഥമിക കീ',
                  indexes: 'സൂചികകൾ',
                  comments: 'അഭിപ്പ്രായങ്ങൾ',
                  no_comments: 'ഒരുതും അഭിപ്പ്രായങ്ങൾ ഇല്ല',
                  add_field: 'ഫീൽഡ് ചേർക്കുക',
                  add_index: 'സൂചിക ചേർക്കുക',
                  index_select_fields: 'ഫീൽഡുകൾ തിരഞ്ഞെടുക്കുക',
                  no_types_found: 'ഒരുതും തരം കണ്ടെത്തിയില്ല',
                  field_name: 'പേരു',
                  field_type: 'തരം',
                  field_actions: {
                      title: 'ഫീൽഡ് ഗുണങ്ങൾ',
                      unique: 'യൂനിക്',
                      comments: 'അഭിപ്പ്രായങ്ങൾ',
                      no_comments: 'ഒരുതും അഭിപ്പ്രായങ്ങൾ ഇല്ല',
                      delete_field: 'ഫീൽഡ് മുടിയുക',
                  },
              
                  index_actions: {
                        title: 'സൂചിക ഗുണങ്ങൾ',
                        name: 'പേരു',
                        unique: 'യൂനിക്',
                        delete_index: 'സൂചിക നീക്കം ചെയ്യുക',
                    },
                    table_actions: {
                        title: 'ടേബിൾ പ്രവർത്തനങ്ങൾ',
                        change_schema: 'സ്കീമ മാറ്റുക',
                        add_field: 'ഫീൽഡ് ചേർക്കുക',
                        add_index: 'സൂചിക ചേർക്കുക',
                        delete_table: 'ടേബിൾ നീക്കം ചെയ്യുക',
                        duplicate_table: 'ഡുപ്ലിക്കേറ്റ് ടേബിൾ',
                    },                    
                },
                empty_state: {
                  title: 'ഒരുതും ടേബിളുകൾ ഇല്ല',
                  description: 'തുടങ്ങാൻ ഒരു ടേബിൾ സൃഷ്ടിക്കുക',
              },              
            },
            relationships_section: {
                  relationships: 'സംബന്ധങ്ങൾ',
                  filter: 'ഫിൽറ്റർ',
                  add_relationship: 'സംബന്ധം ചേർക്കുക',
                  collapse: 'എല്ലാം പ്രതിസന്ധി ചെയ്യുക',
                  relationship: {
                      primary: 'പ്രാഥമിക ടേബിൾ',
                      foreign: 'റഫറൻസ് ടേബിൾ',
                      cardinality: 'കാർഡിനാലിറ്റി',
                      delete_relationship: 'നീക്കം ചെയ്യുക',
                      relationship_actions: {
                          title: 'പ്രവൃത്തി',
                          delete_relationship: 'നീക്കം ചെയ്യുക',
                      },
                  },
              
                  empty_state: {
                        title: 'ഒരുതും ബന്ധങ്ങൾ ഇല്ല',
                        description: 'ടേബിളുകൾ ബന്ധിപ്പിക്കാൻ ഒരു ബന്ധം സൃഷ്ടിക്കുക',
                    },
                  },                    
                  dependencies_section: {
                        dependencies: 'നിർഭരതകൾ',
                        filter: 'ഫിൽറ്റർ',
                        collapse: 'എല്ലാം പ്രതിസന്ധി ചെയ്യുക',
                        dependency: {
                            table: 'ടേബിൾ',
                            dependent_table: 'നിർഭര ടേബിൾ',
                            delete_dependency: 'നീക്കം ചെയ്യുക',
                            dependency_actions: {
                                title: 'പ്രവൃത്തി',
                                delete_dependency: 'നീക്കം ചെയ്യുക',
                            },
                        },
                    
                  empty_state: {
                        title: 'ഒരുതും നിർഭരതകൾ ഇല്ല',
                        description: 'തുടങ്ങാൻ ഒരു ദൃശ്യവൽക്കരണം സൃഷ്ടിക്കുക',
                        },                          
            },
        },

        toolbar: {
            zoom_in: 'ജൂം ഇൻ',
            zoom_out: 'ജൂം ഔട്ട്',
            save: 'സംരക്ഷിക്കുക',
            show_all: 'എല്ലാം കാണിക്കുക',
            undo: 'പൂർവ്വവത്ക്കരിക്കുക',
            redo: 'പുനരാരംഭിക്കുക',
            reorder_diagram: 'ആരാഖം വീണ്ടും ക്രമീകരിക്കുക',
            highlight_overlapping_tables: 'ഒവറ്ലാപ്പിങ് ടേബിളുകൾ ഹൈലൈറ്റ് ചെയ്യുക',
        },
        

        new_diagram_dialog: {
            database_selection: {
                title: 'നിങ്ങളുടെ ഡാറ്റാബേസ് എന്താണ്?',
                description: 'പ്രത്യേകമായ ഓരോ ഡാറ്റാബേസ് കൊണ്ട് സ്വന്തം അന്വയിച്ച സവിശേഷതകളും കഴിവുകളും ഉണ്ട്.',
                check_examples_long: 'ഉദാഹരണങ്ങൾ പരിശോധിക്കുക',
                check_examples_short: 'ഉദാഹരണങ്ങൾ',
            },
        

            import_database: {
                  title: 'നിങ്ങളുടെ ഡാറ്റാബേസ് ഇറക്കുമതി ചെയ്യുക',
                  database_edition: 'ഡാറ്റാബേസ് പതിപ്പ്:',
                  step_1: 'നിങ്ങളുടെ ഡാറ്റാബേസിൽ ഈ സ്ക്രിപ്റ്റ് പ്രവർത്തിപ്പിക്കുക:',
                  step_2: 'സ്ക്രിപ്റ്റ് ഫലം ഇവിടെ പേസ്റ്റുചെയ്യുക:',
                  script_results_placeholder: 'സ്ക്രിപ്റ്റ് ഫലങ്ങൾ ഇവിടെ...',
                  ssms_instructions: {
                      button_text: 'SSMS നിർദ്ദേശങ്ങൾ',
                      title: 'നിർദ്ദേശങ്ങൾ',
                      step_1: 'ടൂൾസ് > ഓപ്ഷനുകൾ > ക്വറി ഫലങ്ങൾ > SQL സർവറിലേക്ക് പോവുക.',
                      step_2: 'നിങ്ങൾ "ഗ്രിഡ് ഫലങ്ങൾ" ഉപയോഗിക്കുന്നുവെങ്കിൽ, നോണിൻ-XML ഡാറ്റയ്ക്കായി പരമാവധി അക്ഷര വീതി വീണ്ടെടുക്കൽ മാറ്റുക (9999999-ൽ സെറ്റ് ചെയ്യുക).',
                  },
              
                // TODO: Add translations
                instructions_link: 'Need help? Watch how',
                check_script_result: 'Check Script Result',
            },

                  cancel: 'റദ്ദാക്കുക',
                  import_from_file: 'ഫയലിൽ നിന്ന് ഇറക്കുമതി ചെയ്യുക',
                  back: 'പുറകോട്ട്',
                  empty_diagram: 'ശൂന്യമായ ആറാഖം',
                  continue: 'തുടരുക',
                  import: 'ഇറക്കുമതി ചെയ്യുക',
        },

        open_diagram_dialog: {
            title: 'ആരാഖം തുറക്കുക',
            description: 'കിടക്കുന്ന പട്ടികയിൽ നിന്ന് തുറക്കാൻ ഒരു ആരാഖം തിരഞ്ഞെടുക്കുക.',
            table_columns: {
                name: 'പേര്',
                created_at: 'സൃഷ്ടിച്ച തിയതി',
                last_modified: 'അവസാനമായി തിരുത്തിയ തിയതി',
                tables_count: 'ടേബിളുകൾ',
            },
            cancel: 'റദ്ദാക്കുക',
            open: 'തുറക്കുക',
        },

        export_sql_dialog: {
            title: 'SQL ഇറക്കുമതി ചെയ്യുക',
            description: 'നിങ്ങളുടെ ആരാഖം സ്കീമ {{databaseType}} സ്ക്രിപ്റ്റിലേക്ക് ഇറക്കുമതി ചെയ്യുക',
            close: 'അടക്കുക',
            loading: {
                text: 'AI {{databaseType}}-നുള്ള SQL സൃഷ്ടിക്കുന്നു...',
                description: 'ഇതിന് 30 സെക്കൻഡ് സമയമെടുക്കും.',
            },
            error: {
                message: 'SQL സ്ക്രിപ്റ്റ് സൃഷ്ടിക്കുമ്പോൾ പിശക്. ദയവായി പിന്നീട് വീണ്ടും ശ്രമിക്കുക അല്ലെങ്കിൽ <0>ഞങ്ങളുമായി ബന്ധപ്പെടുക</0>.',
                description: 'നിങ്ങളുടെ OPENAI_TOKEN ഉപയോഗിക്കാൻ അനുവദിക്കുക, മാനുവൽ <0>ഇവിടെ</0> കാണുക.',
            },
        },

        create_relationship_dialog: {
            title: 'ബന്ധം സൃഷ്ടിക്കുക',
            primary_table: 'പ്രാഥമിക ടേബിൾ',
            primary_field: 'റഫറൻസ് ഫീൽഡ്',
            referenced_table: 'റഫറൻസ് ടേബിൾ',
            referenced_field: 'റഫറൻസ് ഫീൽഡ്',
            primary_table_placeholder: 'ടേബിൾ തിരഞ്ഞെടുക്കുക',
            primary_field_placeholder: 'ഫീൽഡ് തിരഞ്ഞെടുക്കുക',
            referenced_table_placeholder: 'ടേബിൾ തിരഞ്ഞെടുക്കുക',
            referenced_field_placeholder: 'ഫീൽഡ് തിരഞ്ഞെടുക്കുക',
            no_tables_found: 'ഒരുതും ടേബിളുകൾ കണ്ടെത്തിയില്ല',
            no_fields_found: 'ഒരുതും ഫീൽഡുകൾ കണ്ടെത്തിയില്ല',
            create: 'സൃഷ്ടിക്കുക',
            cancel: 'റദ്ദാക്കുക',
        },        

        import_database_dialog: {
            title: 'നിലവിലെ ആരാഖത്തിൽ ഇറക്കുമതി ചെയ്യുക',
            override_alert: {
                title: 'ഡാറ്റാബേസ് ഇറക്കുമതി ചെയ്യുക',
                content: {
                    alert: 'ഈ ആരാഖം ഇറക്കുമതി ചെയ്യുന്നത് നിലവിലെ ടേബിളുകളും ബന്ധങ്ങളും പ്രഭാവితం ചെയ്യും.',
                    new_tables: '<bold>{{newTablesNumber}}</bold> പുതിയ ടേബിളുകൾ ചേർക്കപ്പെടും.',
                    new_relationships: '<bold>{{newRelationshipsNumber}}</bold> പുതിയ ബന്ധങ്ങൾ സൃഷ്ടിക്കപ്പെടും.',
                    tables_override: '<bold>{{tablesOverrideNumber}}</bold> ടേബിളുകൾ മടങ്ങിക്കൊടുക്കപ്പെടും.',
                    proceed: 'നിങ്ങൾക്ക് മുന്നോട്ട് പോകണോ?',
                },
                import: 'ഇറക്കുമതി ചെയ്യുക',
                cancel: 'റദ്ദാക്കുക',
            },
        },
        

        export_image_dialog: {
            title: 'ചിത്രം ഇറക്കുമതി ചെയ്യുക',
            description: 'ഇറക്കുമതി ചെയ്യാനുള്ള സ്കെയിൽ ഫാക്ടർ തിരഞ്ഞെടുക്കുക:',
            scale_1x: '1x സാധാരണ',
            scale_2x: '2x (ഉത്തരവാദിത്വം നൽകിയിരിക്കുന്നതായത്)',
            scale_3x: '3x',
            scale_4x: '4x',
            cancel: 'റദ്ദാക്കുക',
            export: 'ഇറക്കുമതി ചെയ്യുക',
        },
        
        new_table_schema_dialog: {
            title: 'സ്കീമ തിരഞ്ഞെടുക്കുക',
            description: 'ഇപ്പോൾ ഒന്നിലധികം സ്കീമകൾ പ്രദർശിപ്പിക്കപ്പെട്ടിരിക്കുന്നു. പുതിയ ടേബിളിനായി ഒരു സ്കീമ തിരഞ്ഞെടുക്കുക.',
            cancel: 'റദ്ദാക്കുക',
            confirm: 'പുതിയതായി സ്ഥിരീകരിക്കുക',
        },
        

        update_table_schema_dialog: {
            title: 'സ്കീമ മാറ്റുക',
            description: 'ടേബിൾ "{{tableName}}" സ്കീമ അപ്ഡേറ്റ് ചെയ്യുക',
            cancel: 'റദ്ദാക്കുക',
            confirm: 'മാറ്റം വരുത്തുക',
        },        

        star_us_dialog: {
            title: 'ഞങ്ങൾക്ക് മെച്ചപ്പെടുത്താൻ സഹായിക്കൂ!',
            description: 'നിങ്ങൾ GitHub-ൽ ഞങ്ങളെ സ്റ്റാർ ചെയ്യാൻ ആഗ്രഹിക്കുന്നുണ്ടോ? ഇത് ഒരു ക്ലിക്കിൽ ലഭ്യമാണ്!',
            close: 'ഇപ്പോൾ ഇല്ല',
            confirm: 'ശരി, തീർച്ചയായും!',
        },        

        // TODO: Add translations
        export_diagram_dialog: {
            title: 'ആരാഖം ഇറക്കുമതി ചെയ്യുക',
            description: 'ഇറക്കുമതി ചെയ്യാനായി ഫോർമാറ്റ് തിരഞ്ഞെടുക്കുക:',
            format_json: 'JSON',
            cancel: 'റദ്ദാക്കുക',
            export: 'ഇറക്കുമതി ചെയ്യുക',
            error: {
                title: 'ആരാഖം ഇറക്കുമതി ചെയ്യുമ്പോൾ പിശക്',
                description: 'എന്തെങ്കിലും തെറ്റായി പോയി. സഹായം ആവശ്യമുണ്ടോ? chartdb.io@gmail.com',
            },
        },
        

        // TO
        import_diagram_dialog: {
            title: 'Import Diagram',
            description: 'Paste the diagram JSON below:',
            cancel: 'Cancel',
            import: 'Import',
            error: {
                title: 'Error importing diagram',
                description:
                    'The diagram JSON is invalid. Please check the JSON and try again. Need help? chartdb.io@gmail.com',
            },
        },

        relationship_type: {
            one_to_one: 'ഒന്ന് മുതൽ ഒന്ന്',
            one_to_many: 'ഒന്ന് മുതൽ പലതും',
            many_to_one: 'പലതും മുതൽ ഒന്ന്',
            many_to_many: 'പലതും മുതൽ പലതും',
        },        

        canvas_context_menu: {
            new_table: 'പുതിയ ടേബിൾ',
            new_relationship: 'പുതിയ ബന്ധം',
        },
        
        table_node_context_menu: {
            edit_table: 'ടേബിൾ എഡിറ്റ് ചെയ്യുക',
            delete_table: 'ടേബിൾ നീക്കം ചെയ്യുക',
            duplicate_table: 'ഡ്യുപ്ലിക്കേറ്റ് ടേബിൾ',
        },        

        // TODO: Add translations
        snap_to_grid_tooltip: 'Snap to Grid (Hold {{key}})',

        // TODO: Add translations
        tool_tips: {
            double_click_to_edit: 'Double-click to edit',
        },

        language_select: {
            change_language: 'ഭാഷ മാറ്റുക',
        }        
    },
};

export const mlMetadata: LanguageMetadata = {
    name: 'Malyalam',
    nativeName: 'മലയാളം',
    code: 'ml',
};
