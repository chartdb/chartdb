import type { LanguageMetadata, LanguageTranslation } from '../types';

export const ko_KR: LanguageTranslation = {
    translation: {
        menu: {
            file: {
                file: '파일',
                new: '새 다이어그램',
                open: '열기',
                save: '저장',
                import: '데이터베이스 가져오기',
                export_sql: 'SQL로 저장',
                export_as: '다른 형식으로 저장',
                delete_diagram: '다이어그램 삭제',
                exit: '종료',
            },
            edit: {
                edit: '편집',
                undo: '실행 취소',
                redo: '다시 실행',
                clear: '모두 지우기',
            },
            view: {
                view: '보기',
                show_sidebar: '사이드바 보이기',
                hide_sidebar: '사이드바 숨기기',
                hide_cardinality: '카디널리티 숨기기',
                show_cardinality: '카디널리티 보이기',
                zoom_on_scroll: '스크롤 시 확대',
                theme: '테마',
                show_dependencies: '종속성 보이기',
                hide_dependencies: '종속성 숨기기',
                // TODO: Translate
                show_minimap: 'Show Mini Map',
                hide_minimap: 'Hide Mini Map',
            },
            backup: {
                backup: '백업',
                export_diagram: '다이어그램 내보내기',
                restore_diagram: '다이어그램 복구',
            },
            help: {
                help: '도움말',
                docs_website: '선적 서류 비치',
                join_discord: 'Discord 가입',
            },
        },

        delete_diagram_alert: {
            title: '다이어그램 삭제',
            description:
                '이 작업은 되돌릴 수 없으며 다이어그램이 영구적으로 삭제됩니다.',
            cancel: '취소',
            delete: '삭제',
        },

        clear_diagram_alert: {
            title: '다이어그램 지우기',
            description:
                '이 작업은 되돌릴 수 없으며 다이어그램의 모든 데이터가 지워집니다.',
            cancel: '취소',
            clear: '지우기',
        },

        reorder_diagram_alert: {
            title: '다이어그램 재정렬',
            description:
                '이 작업은 모든 다이어그램이 재정렬됩니다. 계속하시겠습니까?',
            reorder: '재정렬',
            cancel: '취소',
        },

        multiple_schemas_alert: {
            title: '다중 스키마',
            description:
                '현재 다이어그램에 {{schemasCount}}개의 스키마가 있습니다. Currently displaying: {{formattedSchemas}}.',
            dont_show_again: '다시 보여주지 마세요',
            change_schema: '변경',
            none: '없음',
        },

        copy_to_clipboard_toast: {
            unsupported: {
                title: '복사 실패',
                description: '클립보드가 지원되지 않습니다"',
            },
            failed: {
                title: '복사 실패',
                description: '문제가 발생했습니다. 다시 시도해주세요.',
            },
        },

        theme: {
            system: '시스템 설정에 따름',
            light: '밝게',
            dark: '어둡게',
        },

        zoom: {
            on: '활성화',
            off: '비활성화',
        },

        last_saved: '최근 저장일시: ',
        saved: '저장됨',
        loading_diagram: '다이어그램 로딩중...',
        deselect_all: '모두 선택 해제',
        select_all: '모두 선택',
        clear: '지우기',
        show_more: '더 보기',
        show_less: '간략히',
        copy_to_clipboard: '클립보드에 복사',
        copied: '복사됨!',

        side_panel: {
            schema: '스키마:',
            filter_by_schema: '스키마로 필터링',
            search_schema: '스키마 검색...',
            no_schemas_found: '스키마를 찾을 수 없습니다.',
            view_all_options: '전체 옵션 보기...',
            tables_section: {
                tables: '테이블',
                add_table: '테이블 추가',
                filter: '필터',
                collapse: '모두 접기',
                // TODO: Translate
                clear: 'Clear Filter',
                no_results: 'No tables found matching your filter.',
                // TODO: Translate
                show_list: 'Show Table List',
                show_dbml: 'Show DBML Editor',

                table: {
                    fields: '필드',
                    nullable: 'null 여부',
                    primary_key: '기본키',
                    indexes: '인덱스',
                    comments: '주석',
                    no_comments: '주석 없음',
                    add_field: '필드 추가',
                    add_index: '인덱스 추가',
                    index_select_fields: '필드 선택',
                    no_types_found: '타입을 찾을 수 없습니다.',
                    field_name: '이름',
                    field_type: '타입',
                    field_actions: {
                        title: '필드 속성',
                        unique: '유니크 여부',
                        comments: '주석',
                        no_comments: '주석 없음',
                        delete_field: '필드 삭제',
                        // TODO: Translate
                        character_length: 'Max Length',
                    },
                    index_actions: {
                        title: '인덱스 속성',
                        name: '인덱스 명',
                        unique: '유니크 여부',
                        delete_index: '인덱스 삭제',
                    },
                    table_actions: {
                        title: '테이블 작업',
                        change_schema: '스키마 변경',
                        add_field: '필드 추가',
                        add_index: '인덱스 추가',
                        duplicate_table: '테이블 복제',
                        delete_table: '테이블 삭제',
                    },
                },
                empty_state: {
                    title: '테이블 없음',
                    description: '테이블을 만들어 시작하세요.',
                },
            },
            relationships_section: {
                relationships: '연관 관계',
                filter: '필터',
                add_relationship: '연관 관계 추가',
                collapse: '모두 접기',
                relationship: {
                    primary: '주 테이블',
                    foreign: '참조 테이블',
                    cardinality: '카디널리티',
                    delete_relationship: '제거',
                    relationship_actions: {
                        title: '연관 관계 작업',
                        delete_relationship: '연관 관계 삭제',
                    },
                },
                empty_state: {
                    title: '연관 관계',
                    description: '테이블 연결을 위해 연관 관계를 생성하세요',
                },
            },
            dependencies_section: {
                dependencies: '종속성',
                filter: '필터',
                collapse: '모두 접기',
                dependency: {
                    table: '테이블',
                    dependent_table: '뷰 테이블',
                    delete_dependency: '삭제',
                    dependency_actions: {
                        title: '종속성 작업',
                        delete_dependency: '뷰 테이블 삭제',
                    },
                },
                empty_state: {
                    title: '뷰 테이블 없음',
                    description: '뷰 테이블을 만들어 시작하세요.',
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
            zoom_in: '확대',
            zoom_out: '축소',
            save: '저장',
            show_all: '전체 저장',
            undo: '실행 취소',
            redo: '다시 실행',
            reorder_diagram: '다이어그램 재정렬',
            highlight_overlapping_tables: '겹치는 테이블 강조 표시',
        },

        new_diagram_dialog: {
            database_selection: {
                title: '당신의 데이터베이스 종류가 무엇인가요?',
                description:
                    '각 데이터베이스에는 고유한 기능과 특징이 있습니다.',
                check_examples_long: '예제 확인',
                check_examples_short: '예제들',
            },

            import_database: {
                title: '당신의 데이터베이스를 가져오세요',
                database_edition: '데이터베이스 세부 종류:',
                step_1: '데이터베이스에서 아래의 SQL을 실행해주세요:',
                step_2: '이곳에 결과를 붙여넣어주세요:',
                script_results_placeholder: '이곳에 스크립트 결과를 입력...',
                ssms_instructions: {
                    button_text: 'SSMS을 사용하시는 경우',
                    title: '지침',
                    step_1: '도구 > 옵션 > 쿼리 응답 > SQL Server',
                    step_2: '"결과를 그리드로 표시"를 사용하는 경우 비 XML 데이터에 대해 검색되는 최대 문자 수를 변경합니다. (9999999로 설정)',
                },
                instructions_link: '도움이 필요하신가요? 영상 가이드 보기',
                check_script_result: '스크립트 결과 확인',
            },

            cancel: '취소',
            back: '뒤로가기',
            import_from_file: '파일에서 가져오기',
            empty_diagram: '빈 다이어그램으로 시작',
            continue: '계속',
            import: '가져오기',
        },

        open_diagram_dialog: {
            title: '다이어그램 열기',
            description: '아래의 목록에서 다이어그램을 선택하세요.',
            table_columns: {
                name: '이름',
                created_at: '생성일시',
                last_modified: '최근 수정일시',
                tables_count: '테이블 갯수',
            },
            cancel: '취소',
            open: '열기',
        },

        export_sql_dialog: {
            title: 'SQL로 내보내기',
            description: '다이어그램 스키마를 {{databaseType}} SQL로 내보내기',
            close: '닫기',
            loading: {
                text: '{{databaseType}} SQL을 AI가 생성하고 있습니다...',
                description: '30초 정도 걸릴 수 있습니다.',
            },
            error: {
                message:
                    'SQL 생성에 실패하였습니다. 잠시후 다시 시도해주세요 계속해서 증상이 발생하는 경우 <0>우리에게 연락해주세요</0>.',
                description:
                    '당신의 OPENAI_TOKEN가 있는 경우, <0>여기에서</0> 메뉴얼을 참고하여 사용하실 수 있습니다.',
            },
        },

        create_relationship_dialog: {
            title: '연관 관계 생성',
            primary_table: '주 테이블',
            primary_field: '주 필드',
            referenced_table: '참조 테이블',
            referenced_field: '참조 필드',
            primary_table_placeholder: '테이블 선택',
            primary_field_placeholder: '필드 선택',
            referenced_table_placeholder: '테이블 선택',
            referenced_field_placeholder: '필드 선택',
            no_tables_found: '테이블을 찾을 수 없습니다',
            no_fields_found: '필드를 찾을 수 없습니다',
            create: '생성',
            cancel: '취소',
        },

        import_database_dialog: {
            title: '현재 다이어그램 가져오기',
            override_alert: {
                title: '데이터베이스 가져오기',
                content: {
                    alert: '이 다이어그램을 가져오면 기존 테이블 및 연관 관계에 영향을 미칩니다.',
                    new_tables:
                        '<bold>{{newTablesNumber}}</bold>개의 신규 테이블 생성됨',
                    new_relationships:
                        '<bold>{{newRelationshipsNumber}}</bold>개의 신규 연관 관계 생성됨',
                    tables_override:
                        '<bold>{{tablesOverrideNumber}}</bold>개의 테이블이 덮어씌워짐',
                    proceed: '정말로 가져오시겠습니까?',
                },
                import: '가져오기',
                cancel: '취소',
            },
        },

        export_image_dialog: {
            title: '이미지로 내보내기',
            description: '내보낼 배율을 선택해주세요:',
            scale_1x: '1x 기본',
            scale_2x: '2x (권장)',
            scale_3x: '3x',
            scale_4x: '4x',
            cancel: '취소',
            export: '내보내기',
            // TODO: Translate
            advanced_options: 'Advanced Options',
            pattern: 'Include background pattern',
            pattern_description: 'Add subtle grid pattern to background.',
            transparent: 'Transparent background',
            transparent_description: 'Remove background color from image.',
        },

        new_table_schema_dialog: {
            title: '스키마 선택',
            description:
                '현재 여러 스키마가 표시됩니다. 새 테이블을 위해 하나를 선택합니다.',
            cancel: '취소',
            confirm: 'Confirm',
        },

        update_table_schema_dialog: {
            title: '스키마 변경',
            description: '"{{tableName}}" 테이블 스키마를 수정합니다',
            cancel: '취소',
            confirm: '변경',
        },

        star_us_dialog: {
            title: '개선할 수 있도록 도와주세요!',
            description:
                'GitHub에 별을 찍어주시겠습니까? 클릭 한번이면 됩니다!',
            close: '아직은 괜찮아요',
            confirm: '당연하죠!',
        },
        export_diagram_dialog: {
            title: '다이어그램 내보내기',
            description: '내보낼 형식을 선택해주세요:',
            format_json: 'JSON',
            cancel: '취소',
            export: '내보내기',
            error: {
                title: '다이어그램 내보내기 오류',
                description:
                    '무언가 문제가 발생하였습니다. 도움이 필요하신 경우 support@chartdb.io으로 연락해주세요.',
            },
        },
        import_diagram_dialog: {
            title: '다이어그램 가져오기',
            description: '아래에 다이어그램 JSON을 첨부해주세요:',
            cancel: '취소',
            import: '가져오기',
            error: {
                title: '다이어그램 가져오기 오류',
                description:
                    '다이어그램 JSON이 유효하지 않습니다. JSON이 올바른 형식인지 확인해주세요. 도움이 필요하신 경우 support@chartdb.io으로 연락해주세요.',
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
            one_to_one: '일대일 (1:1)',
            one_to_many: '일대다 (1:N)',
            many_to_one: '다대일 (N:1)',
            many_to_many: '다대다 (N:N)',
        },

        canvas_context_menu: {
            new_table: '새 테이블',
            new_relationship: '새 연관관계',
            // TODO: Translate
            new_area: 'New Area',
        },

        table_node_context_menu: {
            edit_table: '테이블 수정',
            duplicate_table: '테이블 복제',
            delete_table: '테이블 삭제',
            add_relationship: 'Add Relationship', // TODO: Translate
        },

        snap_to_grid_tooltip: '그리드에 맞추기 ({{key}}를 누른채 유지)',

        tool_tips: {
            double_click_to_edit: '더블클릭하여 편집',
        },

        language_select: {
            change_language: '언어',
        },
    },
};

export const ko_KRMetadata: LanguageMetadata = {
    name: 'Korean',
    nativeName: '한국어',
    code: 'ko_KR',
};
