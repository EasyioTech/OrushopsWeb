// OruShops Affiliate Dashboard Script
// Production-grade JavaScript for dashboard interactivity

(function() {
    'use strict';

    // ========== STATE & CONFIG ==========
    const state = {
        currentSection: 'dashboard',
        user: {
            id: 'AFF001',
            name: 'Amit Sharma',
            email: 'amit@example.com',
            phone: '+91-9876543210',
            level: 'Gold Partner',
            joinDate: '2024-02-15',
            referralCode: 'AMIT2024',
            upiId: 'amit123@okhdfcbank'
        },
        stats: {
            totalEarnings: 45320,
            pendingPayout: 8450,
            totalClicks: 3847,
            totalReferrals: 156,
            monthlyEarnings: 12890,
            conversionRate: 3.2
        },
        withdrawals: [],
        referrals: [],
        analytics: {
            monthly: null,
            clicks: null,
            conversion: null,
            payout: null
        }
    };

    const config = {
        minWithdrawal: 500,
        maxWithdrawal: 100000,
        monthlyDays: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    };

    // ========== SECTION NAVIGATION ==========
    function initNavigation() {
        const navItems = document.querySelectorAll('[data-nav]');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const section = item.getAttribute('data-nav');
                navigateToSection(section);
            });
        });
    }

    function navigateToSection(section) {
        // Hide all sections
        document.querySelectorAll('[data-section]').forEach(el => {
            el.style.display = 'none';
        });

        // Show selected section
        const sectionEl = document.querySelector(`[data-section="${section}"]`);
        if (sectionEl) {
            sectionEl.style.display = 'block';
        }

        // Update nav active state
        document.querySelectorAll('[data-nav]').forEach(el => {
            el.classList.remove('active');
        });
        document.querySelector(`[data-nav="${section}"]`)?.classList.add('active');

        state.currentSection = section;

        // Load section-specific content
        if (section === 'analytics' && !state.analytics.monthly) {
            initCharts();
        }
    }

    // ========== REFERRAL CODE ACTIONS ==========
    function copyReferralCode() {
        const code = state.user.referralCode;
        navigator.clipboard.writeText(code).then(() => {
            showToast('Referral code copied to clipboard!', 'success');
        });
    }

    function shareReferral(platform) {
        const code = state.user.referralCode;
        const url = `https://orushops.com?ref=${code}`;
        const messages = {
            whatsapp: `🎉 Join OruShops Affiliate Program!\n\nEarn ₹50-500 per referral. No investment needed!\n\nUse my code: ${code}\nLink: ${url}\n\n#OruShops #AffiliateProgram`,
            telegram: `Join OruShops Affiliate! 🚀\n\nEarn commissions: ${code}\n${url}`,
            email: {
                subject: 'Join OruShops Affiliate Program - Earn ₹50-500 per referral',
                body: `Hi,\n\nI'm earning with OruShops Affiliate Program. You can too!\n\nReferral Code: ${code}\nLink: ${url}\n\nBest regards`
            }
        };

        switch(platform) {
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(messages.whatsapp)}`);
                break;
            case 'telegram':
                window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(messages.telegram)}`);
                break;
            case 'email':
                window.location.href = `mailto:?subject=${encodeURIComponent(messages.email.subject)}&body=${encodeURIComponent(messages.email.body)}`;
                break;
        }

        showToast(`Shared via ${platform}!`, 'success');
    }

    function showQRCode() {
        const modal = document.getElementById('qr-modal');
        if (modal) {
            modal.style.display = 'flex';

            // Generate QR code if QR library is available
            const qrContainer = document.getElementById('qr-code-container');
            if (qrContainer && typeof QRCode !== 'undefined') {
                qrContainer.innerHTML = '';
                const url = `https://orushops.com?ref=${state.user.referralCode}`;
                new QRCode(qrContainer, {
                    text: url,
                    width: 200,
                    height: 200,
                    colorDark: '#10B981',
                    colorLight: '#0F172A'
                });
            }
        }
    }

    function downloadQRCode() {
        const canvas = document.querySelector('#qr-code-container canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.href = canvas.toDataURL();
            link.download = `referral-code-${state.user.referralCode}.png`;
            link.click();
            showToast('QR code downloaded!', 'success');
        }
    }

    // ========== WITHDRAWAL FUNCTIONALITY ==========
    function openWithdrawalModal() {
        const modal = document.getElementById('withdrawal-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('withdrawal-amount').value = '';
            document.getElementById('withdrawal-error').textContent = '';
        }
    }

    function validateWithdrawal() {
        const amount = parseFloat(document.getElementById('withdrawal-amount').value);
        const errorEl = document.getElementById('withdrawal-error');

        if (!amount) {
            errorEl.textContent = 'Please enter an amount';
            return false;
        }

        if (amount < config.minWithdrawal) {
            errorEl.textContent = `Minimum withdrawal is ₹${config.minWithdrawal}`;
            return false;
        }

        if (amount > config.maxWithdrawal) {
            errorEl.textContent = `Maximum withdrawal is ₹${config.maxWithdrawal}`;
            return false;
        }

        if (amount > state.stats.pendingPayout) {
            errorEl.textContent = 'Insufficient balance';
            return false;
        }

        return true;
    }

    function processWithdrawal() {
        if (!validateWithdrawal()) return;

        const amount = parseFloat(document.getElementById('withdrawal-amount').value);

        // Add to withdrawals history
        state.withdrawals.unshift({
            id: `WD${Date.now()}`,
            amount: amount,
            date: new Date().toLocaleDateString('en-IN'),
            status: 'processing',
            upi: state.user.upiId
        });

        // Update pending payout
        state.stats.pendingPayout -= amount;
        updateMetricCards();

        // Close modal
        closeModal('withdrawal-modal');

        showToast('Withdrawal initiated! You\'ll receive the amount in 2-3 hours.', 'success');

        // Refresh payout history if visible
        if (state.currentSection === 'payouts') {
            updatePayoutHistory();
        }
    }

    // ========== CHARTS & ANALYTICS ==========
    function initCharts() {
        setTimeout(() => {
            createMonthlyEarningsChart();
            createClicksChart();
            createConversionChart();
            createPayoutDistributionChart();
        }, 100);
    }

    function createMonthlyEarningsChart() {
        const ctx = document.getElementById('earnings-chart');
        if (!ctx || typeof Chart === 'undefined') return;

        if (state.analytics.monthly) {
            state.analytics.monthly.destroy();
        }

        const data = [2100, 2800, 3200, 4500, 5600, 7200, 8900, 10200, 9800, 11500, 12890, 8450];

        state.analytics.monthly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: config.monthlyDays,
                datasets: [{
                    label: 'Earnings (₹)',
                    data: data,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#10B981',
                    pointBorderColor: '#16202F',
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#94A3B8' },
                        grid: { color: 'rgba(52, 65, 85, 0.3)' }
                    },
                    x: {
                        ticks: { color: '#94A3B8' },
                        grid: { color: 'rgba(52, 65, 85, 0.3)' }
                    }
                }
            }
        });
    }

    function createClicksChart() {
        const ctx = document.getElementById('clicks-chart');
        if (!ctx || typeof Chart === 'undefined') return;

        if (state.analytics.clicks) {
            state.analytics.clicks.destroy();
        }

        const data = [120, 150, 180, 220, 250, 300, 350, 380, 400, 420, 450, 467];

        state.analytics.clicks = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: config.monthlyDays,
                datasets: [{
                    label: 'Clicks',
                    data: data,
                    backgroundColor: '#06B6D4',
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'x',
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#94A3B8' },
                        grid: { color: 'rgba(52, 65, 85, 0.3)' }
                    },
                    x: {
                        ticks: { color: '#94A3B8' },
                        grid: { color: 'rgba(52, 65, 85, 0.3)' }
                    }
                }
            }
        });
    }

    function createConversionChart() {
        const ctx = document.getElementById('conversion-chart');
        if (!ctx || typeof Chart === 'undefined') return;

        if (state.analytics.conversion) {
            state.analytics.conversion.destroy();
        }

        state.analytics.conversion = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Converted (5 sales)', 'Clicked (155 users)', 'Pending'],
                datasets: [{
                    data: [5, 155, 3687],
                    backgroundColor: ['#10B981', '#06B6D4', '#334155'],
                    borderColor: '#16202F',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#94A3B8' }
                    }
                }
            }
        });
    }

    function createPayoutDistributionChart() {
        const ctx = document.getElementById('payout-chart');
        if (!ctx || typeof Chart === 'undefined') return;

        if (state.analytics.payout) {
            state.analytics.payout.destroy();
        }

        state.analytics.payout = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Paid', 'Pending', 'Processing'],
                datasets: [{
                    label: 'Amount (₹)',
                    data: [36870, 8450, 0],
                    backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { color: '#94A3B8' },
                        grid: { color: 'rgba(52, 65, 85, 0.3)' }
                    },
                    y: {
                        ticks: { color: '#94A3B8' },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // ========== METRIC CARDS UPDATE ==========
    function updateMetricCards() {
        const metrics = [
            { selector: '.metric-earnings', value: `₹${state.stats.totalEarnings.toLocaleString('en-IN')}` },
            { selector: '.metric-pending', value: `₹${state.stats.pendingPayout.toLocaleString('en-IN')}` },
            { selector: '.metric-clicks', value: state.stats.totalClicks.toLocaleString('en-IN') },
            { selector: '.metric-referrals', value: state.stats.totalReferrals },
            { selector: '.metric-level', value: state.user.level },
            { selector: '.metric-monthly', value: `₹${state.stats.monthlyEarnings.toLocaleString('en-IN')}` }
        ];

        metrics.forEach(({ selector, value }) => {
            const el = document.querySelector(selector);
            if (el) {
                el.textContent = value;
            }
        });
    }

    // ========== PAYOUT HISTORY ==========
    function updatePayoutHistory() {
        const container = document.getElementById('payout-history');
        if (!container) return;

        if (state.withdrawals.length === 0) {
            container.innerHTML = '<p style="color: #94A3B8; text-align: center; padding: 20px;">No withdrawals yet</p>';
            return;
        }

        container.innerHTML = state.withdrawals.map(w => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #334155; color: #E2E8F0;">${w.id}</td>
                <td style="padding: 12px; border-bottom: 1px solid #334155; color: #E2E8F0;">₹${w.amount.toLocaleString('en-IN')}</td>
                <td style="padding: 12px; border-bottom: 1px solid #334155; color: #94A3B8;">${w.date}</td>
                <td style="padding: 12px; border-bottom: 1px solid #334155; color: #94A3B8;">${w.upi}</td>
                <td style="padding: 12px; border-bottom: 1px solid #334155;">
                    <span style="background: ${getStatusColor(w.status)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
                        ${capitalize(w.status)}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    // ========== REFERRALS TABLE ==========
    function initReferralsTable() {
        const tableBody = document.getElementById('referrals-body');
        if (!tableBody) return;

        // Mock referrals data
        const referrals = [
            { name: 'Priya Patel', shop: 'Priya Store', joinDate: '2024-05-10', commission: 250, status: 'confirmed' },
            { name: 'Rajesh Kumar', shop: 'Kumar Mart', joinDate: '2024-05-08', commission: 450, status: 'confirmed' },
            { name: 'Sunita Singh', shop: 'Singh Emporium', joinDate: '2024-05-05', commission: 0, status: 'pending' },
            { name: 'Deepak Verma', shop: 'Verma Retail', joinDate: '2024-05-01', commission: 750, status: 'confirmed' },
            { name: 'Neha Sharma', shop: 'Sharma Collection', joinDate: '2024-04-28', commission: 500, status: 'confirmed' },
            { name: 'Arjun Patel', shop: 'Patel Wholesale', joinDate: '2024-04-25', commission: 1200, status: 'confirmed' }
        ];

        tableBody.innerHTML = referrals.map((ref, idx) => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #334155; color: #E2E8F0;">${idx + 1}</td>
                <td style="padding: 12px; border-bottom: 1px solid #334155; color: #E2E8F0;">${ref.name}</td>
                <td style="padding: 12px; border-bottom: 1px solid #334155; color: #94A3B8;">${ref.shop}</td>
                <td style="padding: 12px; border-bottom: 1px solid #334155; color: #94A3B8;">${ref.joinDate}</td>
                <td style="padding: 12px; border-bottom: 1px solid #334155; color: #E2E8F0;">₹${ref.commission.toLocaleString('en-IN')}</td>
                <td style="padding: 12px; border-bottom: 1px solid #334155;">
                    <span style="background: ${ref.status === 'confirmed' ? '#10B981' : '#F59E0B'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
                        ${capitalize(ref.status)}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    // ========== MODAL MANAGEMENT ==========
    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Close modals on background click
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    });

    // ========== UTILITY FUNCTIONS ==========
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10B981' : '#06B6D4'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 1000;
            animation: slideInUp 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function getStatusColor(status) {
        const colors = {
            confirmed: '#10B981',
            pending: '#F59E0B',
            processing: '#06B6D4',
            failed: '#EF4444',
            paid: '#10B981'
        };
        return colors[status] || '#334155';
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // ========== INITIALIZATION ==========
    document.addEventListener('DOMContentLoaded', () => {
        initNavigation();
        updateMetricCards();
        initReferralsTable();
        updatePayoutHistory();

        // Expose functions to global scope
        window.AffiliateApp = {
            copyReferralCode,
            shareReferral,
            showQRCode,
            downloadQRCode,
            openWithdrawalModal,
            processWithdrawal,
            closeModal,
            navigateToSection,
            initCharts
        };
    });

    // Add CSS animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInUp {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideOutDown {
            from { transform: translateY(0); opacity: 1; }
            to { transform: translateY(100px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
})();
