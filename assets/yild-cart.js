/**
 * Yild Unified Add-to-Cart & Cart Drawer Component
 */
(function() {
  'use strict';

  window.YildCart = {
    /**
     * Refreshes the cart count and opens the cart sidebar drawer with updated items
     * @param {Object} [cartData] - Optional Shopify cart JSON object
     */
    refreshDrawer: function(cartData) {
      document.body.classList.add('cart-sidebar-show');

      const updateDOM = function(cart) {
        // Update header & floating count badges
        const countEls = document.querySelectorAll('[data-cart-count]');
        if (countEls) {
          countEls.forEach(function(el) {
            el.textContent = cart.item_count;
          });
        }

        // Update Theme Cart Drawer
        if (window.halo && typeof window.halo.updateSidebarCart === 'function') {
          window.halo.updateSidebarCart(cart);
        } else {
          const cartDropdown = document.querySelector('#halo-cart-sidebar .halo-sidebar-wrapper .previewCart-wrapper');
          if (cartDropdown) {
            fetch(window.Shopify.routes.root + 'cart?view=ajax_side_cart')
              .then(function(res) { return res.text(); })
              .then(function(html) {
                cartDropdown.innerHTML = html;
              })
              .catch(function(err) {
                console.error('Failed to fetch ajax_side_cart:', err);
              });
          }
        }
      };

      if (cartData && typeof cartData === 'object') {
        updateDOM(cartData);
      } else if (typeof Shopify !== 'undefined' && typeof Shopify.getCart === 'function') {
        Shopify.getCart(updateDOM);
      } else {
        fetch(window.Shopify.routes.root + 'cart.js')
          .then(function(res) { return res.json(); })
          .then(updateDOM)
          .catch(function(err) { console.error('Failed to fetch cart.js:', err); });
      }
    },

    /**
     * Adds item(s) to cart via AJAX and updates the drawer
     * @param {FormData|HTMLFormElement|Object} payload - FormData, HTML Form element, or JS Object
     * @param {Object} [options] - Optional options { button, onSuccess, onError }
     */
    add: function(payload, options) {
      options = options || {};
      let body;
      let headers = {};
      let btn = options.button;

      if (payload instanceof HTMLFormElement) {
        body = new FormData(payload);
        if (!btn) {
          btn = payload.querySelector('button[type="submit"], input[type="submit"]');
        }
      } else if (payload instanceof FormData) {
        body = payload;
      } else if (typeof payload === 'object') {
        body = JSON.stringify(payload);
        headers['Content-Type'] = 'application/json';
      } else {
        console.error('Invalid YildCart.add payload');
        return Promise.reject(new Error('Invalid payload'));
      }

      if (btn) {
        btn.classList.add('is-loading');
        btn.setAttribute('disabled', 'disabled');
      }

      return fetch(window.Shopify.routes.root + 'cart/add.js', {
        method: 'POST',
        headers: headers,
        body: body
      })
      .then(function(res) {
        if (!res.ok) {
          return res.json().then(function(err) { throw err; });
        }
        return res.json();
      })
      .then(function(item) {
        if (btn) {
          btn.classList.remove('is-loading');
          btn.removeAttribute('disabled');
        }
        window.YildCart.refreshDrawer();
        if (typeof options.onSuccess === 'function') {
          options.onSuccess(item, btn);
        }
        return item;
      })
      .catch(function(err) {
        console.error('YildCart.add error:', err);
        if (btn) {
          btn.classList.remove('is-loading');
          btn.removeAttribute('disabled');
        }
        if (typeof options.onError === 'function') {
          options.onError(err, btn);
        }
        throw err;
      });
    }
  };
})();
