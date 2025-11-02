import type { LanguageMetadata, LanguageTranslation } from '../types';

export const vi: LanguageTranslation = {
    translation: {
        editor_sidebar: {
            new_diagram: 'Mới',
            browse: 'Duyệt',
            tables: 'Bảng',
            refs: 'Refs',
            dependencies: 'Phụ thuộc',
            custom_types: 'Kiểu tùy chỉnh',
            visuals: 'Hình ảnh',
        },
        menu: {
            actions: {
                actions: 'Hành động',
                new: 'Mới...',
                browse: 'Duyệt...',
                save: 'Lưu',
                import: 'Nhập cơ sở dữ liệu',
                export_sql: 'Xuất SQL',
                export_as: 'Xuất thành',
                delete_diagram: 'Xóa',
            },
            edit: {
                edit: 'Sửa',
                undo: 'Hoàn tác',
                redo: 'Làm lại',
                clear: 'Xóa',
            },
            view: {
                view: 'Xem',
                show_sidebar: 'Hiển thị thanh bên',
                hide_sidebar: 'Ẩn thanh bên',
                hide_cardinality: 'Ẩn số lượng',
                show_cardinality: 'Hiển thị số lượng',
                show_field_attributes: 'Hiển thị thuộc tính trường',
                hide_field_attributes: 'Ẩn thuộc tính trường',
                zoom_on_scroll: 'Thu phóng khi cuộn',
                show_views: 'Chế độ xem Cơ sở dữ liệu',
                theme: 'Chủ đề',
                show_dependencies: 'Hiển thị các phụ thuộc',
                hide_dependencies: 'Ẩn các phụ thuộc',
                // TODO: Translate
                show_minimap: 'Show Mini Map',
                hide_minimap: 'Hide Mini Map',
            },
            backup: {
                backup: 'Hỗ trợ',
                export_diagram: 'Xuất sơ đồ',
                restore_diagram: 'Khôi phục sơ đồ',
            },
            help: {
                help: 'Trợ giúp',
                docs_website: 'Tài liệu',
                join_discord: 'Tham gia Discord',
            },
        },

        delete_diagram_alert: {
            title: 'Xóa sơ đồ',
            description:
                'Không thể hoàn tác hành động này. Thao tác này sẽ xóa vĩnh viễn sơ đồ.',
            cancel: 'Hủy',
            delete: 'Xóa',
        },

        clear_diagram_alert: {
            title: 'Xóa dữ liệu trong sơ đồ',
            description:
                'Không thể hoàn tác hành động này. Thao tác này sẽ xóa vĩnh viễn mọi dữ liệu trong sơ đồ.',
            cancel: 'Hủy',
            clear: 'Xóa',
        },

        reorder_diagram_alert: {
            title: 'Tự động sắp xếp sơ đồ',
            description:
                'Hành động này sẽ sắp xếp lại tất cả các bảng trong sơ đồ. Bạn có muốn tiếp tục không?',
            reorder: 'Tự động sắp xếp',
            cancel: 'Hủy',
        },

        copy_to_clipboard_toast: {
            unsupported: {
                title: 'Sao chép thất bại',
                description: 'Không hỗ trợ bảng tạm',
            },
            failed: {
                title: 'Sao chép thất bại',
                description: 'Đã xảy ra lỗi. Vui lòng thử lại.',
            },
        },

        theme: {
            system: 'Hệ thống',
            light: 'Sáng',
            dark: 'Tối',
        },

        zoom: {
            on: 'Bật',
            off: 'Tất',
        },

        last_saved: 'Đã lưu lần cuối',
        saved: 'Đã lưu',
        loading_diagram: 'Đang tải sơ đồ...',
        deselect_all: 'Bỏ chọn tất cả',
        select_all: 'Chọn tất cả',
        clear: 'Xóa',
        show_more: 'Hiển thị thêm',
        show_less: 'Hiển thị ít hơn',
        copy_to_clipboard: 'Sao chép vào bảng tạm',
        copied: 'Đã sao chép!',

        side_panel: {
            view_all_options: 'Xem tất cả tùy chọn...',
            tables_section: {
                tables: 'Bảng',
                add_table: 'Thêm bảng',
                add_view: 'Thêm Chế độ xem',
                filter: 'Lọc',
                collapse: 'Thu gọn tất cả',
                // TODO: Translate
                clear: 'Clear Filter',
                no_results: 'No tables found matching your filter.',
                // TODO: Translate
                show_list: 'Show Table List',
                show_dbml: 'Show DBML Editor',

                table: {
                    fields: 'Trường',
                    nullable: 'Có thể NULL?',
                    primary_key: 'Khóa chính',
                    indexes: 'Chỉ mục',
                    comments: 'Bình luận',
                    no_comments: 'Không có bình luận',
                    add_field: 'Thêm trường',
                    add_index: 'Thêm chỉ mục',
                    index_select_fields: 'Chọn trường',
                    no_types_found: 'Không tìm thấy',
                    field_name: 'Tên trường',
                    field_type: 'Loại trường',
                    field_actions: {
                        title: 'Thuộc tính trường',
                        unique: 'Giá trị duy nhất',
                        auto_increment: 'Tự động tăng',
                        comments: 'Bình luận',
                        no_comments: 'Không có bình luận',
                        delete_field: 'Xóa trường',
                        // TODO: Translate
                        default_value: 'Default Value',
                        no_default: 'No default',
                        // TODO: Translate
                        character_length: 'Max Length',
                        precision: 'Độ chính xác',
                        scale: 'Tỷ lệ',
                    },
                    index_actions: {
                        title: 'Thuộc tính chỉ mục',
                        name: 'Tên',
                        unique: 'Giá trị duy nhất',
                        index_type: 'Loại chỉ mục',
                        delete_index: 'Xóa chỉ mục',
                    },
                    table_actions: {
                        title: 'Hành động',
                        change_schema: 'Thay đổi lược đồ',
                        add_field: 'Thêm trường',
                        add_index: 'Thêm chỉ mục',
                        duplicate_table: 'Nhân đôi bảng',
                        delete_table: 'Xóa bảng',
                    },
                },
                empty_state: {
                    title: 'Không có bảng',
                    description: 'Tạo một bảng để bắt đầu',
                },
            },
            refs_section: {
                refs: 'Refs',
                filter: 'Lọc',
                collapse: 'Thu gọn tất cả',
                add_relationship: 'Thêm quan hệ',
                relationships: 'Quan hệ',
                dependencies: 'Phụ thuộc',
                relationship: {
                    relationship: 'Quan hệ',
                    primary: 'Bảng khóa chính',
                    foreign: 'Bảng khóa ngoại',
                    cardinality: 'Quan hệ',
                    delete_relationship: 'Xóa',
                    relationship_actions: {
                        title: 'Hành động',
                        delete_relationship: 'Xóa',
                    },
                },
                dependency: {
                    dependency: 'Phụ thuộc',
                    table: 'Bảng',
                    dependent_table: 'Bảng xem phụ thuộc',
                    delete_dependency: 'Xóa',
                    dependency_actions: {
                        title: 'Hành động',
                        delete_dependency: 'Xóa',
                    },
                },
                empty_state: {
                    title: 'Không có quan hệ',
                    description: 'Tạo một quan hệ để bắt đầu',
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

            visuals_section: {
                visuals: 'Hình ảnh',
                tabs: {
                    areas: 'Areas',
                    notes: 'Ghi chú',
                },
            },

            notes_section: {
                filter: 'Lọc',
                add_note: 'Thêm Ghi Chú',
                no_results: 'Không tìm thấy ghi chú',
                clear: 'Xóa Bộ Lọc',
                empty_state: {
                    title: 'Không Có Ghi Chú',
                    description:
                        'Tạo ghi chú để thêm chú thích văn bản trên canvas',
                },
                note: {
                    empty_note: 'Ghi chú trống',
                    note_actions: {
                        title: 'Hành Động Ghi Chú',
                        edit_content: 'Chỉnh Sửa Nội Dung',
                        delete_note: 'Xóa Ghi Chú',
                    },
                },
            },

            // TODO: Translate
            custom_types_section: {
                custom_types: 'Custom Types',
                filter: 'Filter',
                clear: 'Clear Filter',
                no_results: 'No custom types found matching your filter.',
                empty_state: {
                    title: 'No custom types',
                    description:
                        'Custom types will appear here when they are available in your database',
                },
                custom_type: {
                    kind: 'Kind',
                    enum_values: 'Enum Values',
                    composite_fields: 'Fields',
                    no_fields: 'No fields defined',
                    no_values: 'Không có giá trị enum được định nghĩa',
                    field_name_placeholder: 'Field name',
                    field_type_placeholder: 'Select type',
                    add_field: 'Add Field',
                    no_fields_tooltip: 'No fields defined for this custom type',
                    custom_type_actions: {
                        title: 'Actions',
                        highlight_fields: 'Highlight Fields',
                        delete_custom_type: 'Delete',
                        clear_field_highlight: 'Clear Highlight',
                    },
                    delete_custom_type: 'Delete Type',
                },
            },
        },

        toolbar: {
            zoom_in: 'Phóng to',
            zoom_out: 'Thu nhỏ',
            save: 'Lưu',
            show_all: 'Hiển thị tất cả',
            undo: 'Hoàn tác',
            redo: 'Làm lại',
            reorder_diagram: 'Tự động sắp xếp sơ đồ',
            // TODO: Translate
            clear_custom_type_highlight: 'Clear highlight for "{{typeName}}"',
            custom_type_highlight_tooltip:
                'Highlighting "{{typeName}}" - Click to clear',
            highlight_overlapping_tables: 'Làm nổi bật các bảng chồng chéo',
            // TODO: Translate
            filter: 'Filter Tables',
        },

        new_diagram_dialog: {
            database_selection: {
                title: 'Cơ sở dữ liệu của bạn là gì?',
                description:
                    'Mỗi cơ sở dữ liệu có những tính năng và khả năng riêng biệt.',
                check_examples_long: 'Xem ví dụ',
                check_examples_short: 'Ví dụ',
            },

            import_database: {
                title: 'Nhập cơ sở dữ liệu của bạn',
                database_edition: 'Loại:',
                step_1: 'Chạy lệnh này trong cơ sở dữ liệu của bạn:',
                step_2: 'Dán kết quả vào đây →',
                script_results_placeholder: 'Kết quả...',
                ssms_instructions: {
                    button_text: 'Hướng dẫn SSMS',
                    title: 'Hướng dẫn',
                    step_1: 'Đi đến Tools > Options > Query Results > SQL Server.',
                    step_2: 'Nếu bạn đang sử dụng "Results to Grid," thay đổi Maximum Characters Retrieved cho Non-XML (đặt thành 9999999).',
                },
                instructions_link: 'Cần trợ giúp? Xem ngay',
                check_script_result: 'Xem kết quả',
            },

            cancel: 'Hủy',
            import_from_file: 'Nhập từ tệp',
            back: 'Trở lại',
            empty_diagram: 'Cơ sở dữ liệu trống',
            continue: 'Tiếp tục',
            import: 'Nhập',
        },

        open_diagram_dialog: {
            title: 'Mở cơ sở dữ liệu',
            description: 'Chọn sơ đồ để mở từ danh sách bên dưới.',
            table_columns: {
                name: 'Tên',
                created_at: 'Tạo vào lúc',
                last_modified: 'Lần cuối chỉnh sửa',
                tables_count: 'Số bảng',
            },
            cancel: 'Hủy',
            open: 'Mở',

            diagram_actions: {
                open: 'Mở',
                duplicate: 'Nhân bản',
                delete: 'Xóa',
            },
        },

        export_sql_dialog: {
            title: 'Xuất SQL',
            description: 'Xuất sơ đồ của bạn sang {{databaseType}}',
            close: 'Đóng',
            loading: {
                text: 'AI đang tạo SQL cho {{databaseType}}...',
                description: 'Việc này có thể mất khoảng 30 giây.',
            },
            error: {
                message:
                    'Lỗi khi tạo SQL. Vui lòng thử lại sau hoặc <0>liên hệ với chúng tôi</0>.',
                description:
                    'Bạn có thể sử dụng OPENAI_TOKEN, xem hướng dẫn <0>tại đây</0>.',
            },
        },

        create_relationship_dialog: {
            title: 'Tạo quan hệ',
            primary_table: 'Bảng chính',
            primary_field: 'Khóa chính',
            referenced_table: 'Bảng tham chiếu',
            referenced_field: 'Khóa tham chiếu',
            primary_table_placeholder: 'Chọn bảng',
            primary_field_placeholder: 'Chọn trường',
            referenced_table_placeholder: 'Chọn bảng',
            referenced_field_placeholder: 'Chọn trường',
            no_tables_found: 'Không tìm thấy bảng',
            no_fields_found: 'Không tìm thấy trường',
            create: 'Tạo',
            cancel: 'Hủy',
        },

        import_database_dialog: {
            title: 'Nhập vào sơ đồ hiện tại',
            override_alert: {
                title: 'Nhập cơ sở dữ liệu',
                content: {
                    alert: 'Việc nhập sơ đồ này sẽ ảnh hưởng đến các bảng và mối quan hệ hiện có.',
                    new_tables:
                        '<bold>{{newTablesNumber}}</bold> bảng mới sẽ được thêm vào.',
                    new_relationships:
                        '<bold>{{newRelationshipsNumber}}</bold> quan hệ mới sẽ được tạo.',
                    tables_override:
                        '<bold>{{tablesOverrideNumber}}</bold> bảng sẽ bị ghi đè.',
                    proceed: 'Bạn có muốn tiếp tục không?',
                },
                import: 'Nhập',
                cancel: 'Hủy',
            },
        },

        export_image_dialog: {
            title: 'Xuất ảnh',
            description: 'Chọn tỉ lệ để xuất:',
            scale_1x: '1x Thông thường',
            scale_2x: '2x (Khuyến khích)',
            scale_3x: '3x',
            scale_4x: '4x',
            cancel: 'Hủy',
            export: 'Xuất',
            // TODO: Translate
            advanced_options: 'Advanced Options',
            pattern: 'Include background pattern',
            pattern_description: 'Add subtle grid pattern to background.',
            transparent: 'Transparent background',
            transparent_description: 'Remove background color from image.',
        },

        new_table_schema_dialog: {
            title: 'Chọn lược đồ',
            description:
                'Nhiều lược đồ hiện đang được hiển thị. Chọn một lược đồ cho bảng mới.',
            cancel: 'Hủy',
            confirm: 'Xác nhận',
        },

        update_table_schema_dialog: {
            title: 'Thay đổi lược đồ',
            description: 'Cập nhật lược đồ bảng "{{tableName}}"',
            cancel: 'Hủy',
            confirm: 'Xác nhận',
        },

        create_table_schema_dialog: {
            title: 'Tạo lược đồ mới',
            description:
                'Chưa có lược đồ nào. Tạo lược đồ đầu tiên của bạn để tổ chức các bảng.',
            create: 'Tạo',
            cancel: 'Hủy',
        },

        star_us_dialog: {
            title: 'Hãy giúp chúng tôi cải thiện!',
            description:
                'Bạn có muốn ủng hộ chúng tôi bằng cách gắn sao trên GitHub không? Chỉ cần một cú nhấp chuột là được!',
            close: 'Chưa phải bây giờ',
            confirm: 'Dĩ nhiên rồi!',
        },
        export_diagram_dialog: {
            title: 'Xuất sơ đồ',
            description: 'Chọn định dạng để xuất:',
            format_json: 'JSON',
            cancel: 'Hủy',
            export: 'Xuất',
            error: {
                title: 'Lỗi khi xuất sơ đồ',
                description:
                    'Có gì đó không ổn. Cần trợ giúp? support@chartdb.io',
            },
        },

        import_diagram_dialog: {
            title: 'Nhập sơ đồ',
            description: 'Dán sơ đồ ở dạng JSON bên dưới:',
            cancel: 'Hủy',
            import: 'Nhập',
            error: {
                title: 'Lỗi khi nhập sơ đồ',
                description:
                    'Sơ đồ ở dạng JSON không hợp lệ. Vui lòng kiểm tra JSON và thử lại. Bạn cần trợ giúp? support@chartdb.io',
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
            one_to_one: 'Quan hệ một-một',
            one_to_many: 'Quan hệ một-nhiều',
            many_to_one: 'Quan hệ nhiều-một',
            many_to_many: 'Quan hệ nhiều-nhiều',
        },

        canvas_context_menu: {
            new_table: 'Tạo bảng mới',
            new_view: 'Chế độ xem Mới',
            new_relationship: 'Tạo quan hệ mới',
            // TODO: Translate
            new_area: 'New Area',
            new_note: 'Ghi Chú Mới',
        },

        table_node_context_menu: {
            edit_table: 'Sửa bảng',
            duplicate_table: 'Nhân đôi bảng',
            delete_table: 'Xóa bảng',
            add_relationship: 'Add Relationship', // TODO: Translate
        },

        snap_to_grid_tooltip: 'Căn lưới (Giữ phím {{key}})',

        tool_tips: {
            double_click_to_edit: 'Nhấp đúp để chỉnh sửa',
        },

        language_select: {
            change_language: 'Ngôn ngữ',
        },

        on: 'Bật',
        off: 'Tắt',
    },
};

export const viMetadata: LanguageMetadata = {
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    code: 'vi',
};
