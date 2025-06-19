// Test script để kiểm tra bulk delete API
// Chạy trong browser console

async function testBulkDelete() {
    console.log('🧪 Testing bulk delete API...');
    
    // Lấy token từ cookie
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    };
    
    const tokenCookie = getCookie('token');
    console.log('📝 Raw token cookie:', tokenCookie);
    
    if (!tokenCookie) {
        console.error('❌ No token found in cookies');
        return;
    }
    
    let accessToken;
    try {
        const tokenData = JSON.parse(tokenCookie);
        accessToken = tokenData.accessToken;
        console.log('✅ Parsed token successfully, accessToken exists:', !!accessToken);
    } catch (e) {
        console.log('⚠️ Token parse failed, using raw token:', e.message);
        accessToken = tokenCookie;
    }
    
    // Test 1: Lấy danh sách thông báo
    console.log('\n📋 Step 1: Getting notifications...');
    try {
        const notifResponse = await fetch('/api/admin/notifications?limit=5');
        const notifData = await notifResponse.json();
        console.log('✅ Notifications response:', notifData);
        
        if (!notifData.notifications || notifData.notifications.length === 0) {
            console.log('⚠️ No notifications found, creating test notifications first...');
            
            // Tạo thông báo test
            const createResponse = await fetch('/api/admin/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: 'Test Notification for Delete',
                    message: 'This is a test notification to be deleted',
                    type: 'info',
                    sentTo: 'all'
                })
            });
            
            if (createResponse.ok) {
                console.log('✅ Created test notification');
                // Lấy lại danh sách
                const newNotifResponse = await fetch('/api/admin/notifications?limit=5');
                const newNotifData = await newNotifResponse.json();
                console.log('📋 Updated notifications:', newNotifData);
            } else {
                console.error('❌ Failed to create test notification');
                return;
            }
        }
        
        // Test 2: Bulk delete
        console.log('\n🗑️ Step 2: Testing bulk delete...');
        const testIds = notifData.notifications?.slice(0, 1).map(n => n._id) || [];
        
        if (testIds.length === 0) {
            console.error('❌ No notification IDs to test with');
            return;
        }
        
        console.log('🎯 Testing with IDs:', testIds);
        
        const bulkDeleteResponse = await fetch('/api/admin/notifications/bulk', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                notificationIds: testIds
            })
        });
        
        console.log('📊 Bulk delete response status:', bulkDeleteResponse.status);
        
        if (bulkDeleteResponse.ok) {
            const result = await bulkDeleteResponse.json();
            console.log('✅ Bulk delete successful:', result);
        } else {
            const errorText = await bulkDeleteResponse.text();
            console.error('❌ Bulk delete failed:', {
                status: bulkDeleteResponse.status,
                statusText: bulkDeleteResponse.statusText,
                error: errorText
            });
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Chạy test
testBulkDelete();
