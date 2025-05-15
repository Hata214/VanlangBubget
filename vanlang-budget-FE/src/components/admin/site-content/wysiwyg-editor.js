// Script để tự động hiển thị các phần tử có thể chỉnh sửa khi trang được tải

// Hàm để hiển thị các phần tử có thể chỉnh sửa
function highlightEditableElements() {
  // Tìm tất cả các phần tử có thể chỉnh sửa
  const editableFields = document.querySelectorAll('.editable-field, .editable-image, .editable-button');

  // Nếu không có phần tử nào, thoát
  if (editableFields.length === 0) {
    return;
  }

  // Thêm class để hiển thị các phần tử có thể chỉnh sửa
  editableFields.forEach((field, index) => {
    // Thêm hiệu ứng với độ trễ khác nhau cho mỗi phần tử
    setTimeout(() => {
      // Thêm class highlight
      field.classList.add('highlight-editable');

      // Thêm hiệu ứng rung nhẹ
      field.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-3px)' },
        { transform: 'translateX(3px)' },
        { transform: 'translateX(-2px)' },
        { transform: 'translateX(2px)' },
        { transform: 'translateX(0)' }
      ], {
        duration: 500,
        easing: 'ease-in-out'
      });

      // Thêm hiệu ứng pulse cho biểu tượng chỉnh sửa
      const editIcon = field.querySelector('.edit-icon');
      if (editIcon) {
        editIcon.style.opacity = '1';
        editIcon.animate([
          { transform: 'scale(1)', opacity: 0.7 },
          { transform: 'scale(1.2)', opacity: 1 },
          { transform: 'scale(1)', opacity: 0.7 }
        ], {
          duration: 800,
          iterations: 2,
          easing: 'ease-in-out'
        });

        // Ẩn biểu tượng sau khi hoàn thành animation
        setTimeout(() => {
          editIcon.style.opacity = '';
        }, 1600);
      }

      // Xóa class sau 2.5 giây
      setTimeout(() => {
        field.classList.remove('highlight-editable');
      }, 2500);
    }, index * 200); // Độ trễ tăng dần cho mỗi phần tử
  });
}

// Hàm để thêm các sự kiện cho các phần tử có thể chỉnh sửa
function addEditableEvents() {
  // Tìm tất cả các phần tử có thể chỉnh sửa
  const editableFields = document.querySelectorAll('.editable-field, .editable-image, .editable-button');

  // Nếu không có phần tử nào, thoát
  if (editableFields.length === 0) {
    return;
  }

  // Thêm sự kiện cho mỗi phần tử
  editableFields.forEach(field => {
    // Thêm sự kiện hover
    field.addEventListener('mouseenter', () => {
      field.classList.add('hover-highlight');
    });

    field.addEventListener('mouseleave', () => {
      field.classList.remove('hover-highlight');
    });
  });
}

// Hàm khởi tạo
function initWysiwygEditor() {
  // Đợi DOM được tải xong
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Hiển thị các phần tử có thể chỉnh sửa sau khi trang được tải
      setTimeout(highlightEditableElements, 1000);

      // Thêm các sự kiện cho các phần tử có thể chỉnh sửa
      addEditableEvents();
    });
  } else {
    // Hiển thị các phần tử có thể chỉnh sửa sau khi trang được tải
    setTimeout(highlightEditableElements, 1000);

    // Thêm các sự kiện cho các phần tử có thể chỉnh sửa
    addEditableEvents();
  }
}

// Khởi tạo
initWysiwygEditor();

// Export các hàm để có thể sử dụng ở nơi khác
export { highlightEditableElements, addEditableEvents, initWysiwygEditor };
